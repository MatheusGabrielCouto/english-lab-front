"use client";

import "pdfjs-dist/web/pdf_viewer.css";
import type { PDFDocumentProxy, RenderTask, TextLayer } from "pdfjs-dist";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api-client";
import type { Book } from "@/lib/book-types";
import { cn } from "@/lib/cn";
import { globalOffset, highlight, readPageText, wordAtPoint } from "@/lib/page-text";
import { loadPdfJs, PDF_ASSETS } from "@/lib/pdf";
import { normalizeSelection, sentenceAround } from "@/lib/reading-context";
import { useLocalSetting } from "@/lib/use-local-setting";
import { WordPopup, type LookupTarget } from "@/components/library/word-popup";

const THEMES = ["light", "sepia", "dark"] as const;
type Theme = (typeof THEMES)[number];

const THEME_LABEL: Record<Theme, string> = { light: "Claro", sepia: "Sépia", dark: "Escuro" };

/** O PDF é desenhado em canvas; sépia e escuro são filtros sobre o canvas (o texto selecionável fica intacto). */
const THEME_STYLE: Record<Theme, { stage: string; filter: string }> = {
  light: { stage: "bg-surface-soft", filter: "none" },
  sepia: { stage: "bg-[#e7dcc3]", filter: "sepia(0.55) saturate(1.1) brightness(0.96)" },
  dark: { stage: "bg-[#14131a]", filter: "invert(0.9) hue-rotate(180deg) brightness(0.95)" },
};

const ZOOMS = ["0.75", "1", "1.25", "1.5", "2", "2.5"] as const;
const MAX_FIT_WIDTH = 900; // largura confortável de leitura em telas grandes
const SAVE_DELAY = 700;

type LoadState = { kind: "loading" } | { kind: "ready" } | { kind: "error"; message: string };

export function PdfReader({ book }: { book: Book }) {
  const initialPage = Math.max(1, Math.min(book.progress?.page ?? 1, book.pageCount ?? Infinity));

  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [page, setPage] = useState(initialPage);
  const [pageInput, setPageInput] = useState(String(initialPage));
  const [rendering, setRendering] = useState(false);
  const [drawn, setDrawn] = useState(false); // já há uma página na tela
  const [theme, setTheme] = useLocalSetting<Theme>("reader-theme", "light", THEMES);
  const [zoomKey, setZoomKey] = useLocalSetting("reader-zoom", "1", ZOOMS);
  const [width, setWidth] = useState(0);
  const [target, setTarget] = useState<LookupTarget | null>(null);
  const [hint, setHint] = useLocalSetting("reader-hint", "show", ["show", "hidden"] as const);
  const targetCounter = useRef(0);

  const stage = useRef<HTMLDivElement>(null);
  const canvasHolder = useRef<HTMLDivElement>(null);
  const textHolder = useRef<HTMLDivElement>(null);
  const pageBox = useRef<HTMLDivElement>(null);
  const savedPage = useRef(initialPage);
  const latest = useRef({ page: initialPage, total: book.pageCount ?? 0 });

  const numPages = doc?.numPages ?? book.pageCount ?? 0;
  const zoom = Number(zoomKey);

  // guarda o último valor para os ouvintes (teclado, salvar ao sair) lerem sem recriar
  useEffect(() => {
    latest.current = { page, total: numPages };
  });

  /* ---------- carregar o PDF (link temporário direto do bucket) ---------- */
  useEffect(() => {
    let cancelled = false;
    let task: ReturnType<Awaited<ReturnType<typeof loadPdfJs>>["getDocument"]> | undefined;

    (async () => {
      setState({ kind: "loading" });
      try {
        const [pdfjs, { url }] = await Promise.all([
          loadPdfJs(),
          api<{ url: string }>(`/books/${book.id}/file`),
        ]);
        if (cancelled) return;
        task = pdfjs.getDocument({ url, ...PDF_ASSETS });
        const loaded = await task.promise;
        if (cancelled) return;
        setDoc(loaded);
        setState({ kind: "ready" });
      } catch {
        if (!cancelled) {
          setState({
            kind: "error",
            message: "Não consegui abrir este livro. Confira sua conexão e tente de novo.",
          });
        }
      }
    })();

    return () => {
      cancelled = true;
      void task?.destroy();
    };
  }, [book.id, attempt]);

  /* ---------- largura disponível, para ajustar a página à tela ---------- */
  useEffect(() => {
    const element = stage.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  /* ---------- desenhar a página atual ---------- */
  useEffect(() => {
    if (!doc || !width) return;
    let cancelled = false;
    let renderTask: RenderTask | undefined;
    let textLayer: TextLayer | undefined;

    (async () => {
      setRendering(true);
      try {
        const pdfjs = await loadPdfJs();
        const pdfPage = await doc.getPage(page);
        if (cancelled) return;

        const base = pdfPage.getViewport({ scale: 1 });
        const fit = Math.min(width - 32, MAX_FIT_WIDTH) / base.width;
        const viewport = pdfPage.getViewport({ scale: Math.max(0.2, fit) * zoom });

        // desenha fora da tela e só troca quando pronto: a página anterior não pisca
        const outputScale = window.devicePixelRatio || 1;
        const canvas = document.createElement("canvas");
        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;
        canvas.setAttribute("role", "img");
        canvas.setAttribute("aria-label", `Página ${page} de ${doc.numPages}`);

        renderTask = pdfPage.render({
          canvas,
          viewport,
          transform: outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined,
        });
        await renderTask.promise;
        if (cancelled) return;

        const text = document.createElement("div");
        text.className = "textLayer";
        text.style.setProperty("--total-scale-factor", String(viewport.scale));
        textLayer = new pdfjs.TextLayer({
          textContentSource: pdfPage.streamTextContent(),
          container: text,
          viewport,
        });
        await textLayer.render();
        if (cancelled) return;

        canvasHolder.current?.replaceChildren(canvas);
        textHolder.current?.replaceChildren(text);
        if (pageBox.current) {
          pageBox.current.style.width = `${Math.floor(viewport.width)}px`;
          pageBox.current.style.height = `${Math.floor(viewport.height)}px`;
        }
        stage.current?.scrollTo({ top: 0 });
        setDrawn(true);
      } catch (error) {
        // cancelar uma renderização antiga (troca rápida de página) não é erro
        if (!cancelled && (error as Error).name !== "RenderingCancelledException") {
          setState({ kind: "error", message: "Não consegui desenhar esta página." });
        }
      } finally {
        if (!cancelled) setRendering(false);
      }
    })();

    return () => {
      cancelled = true;
      renderTask?.cancel();
      textLayer?.cancel();
    };
  }, [doc, page, zoom, width]);

  /* ---------- salvar onde o leitor parou ---------- */
  const save = useCallback(
    (keepalive = false) => {
      const { page: current, total } = latest.current;
      if (!total || current === savedPage.current) return;
      savedPage.current = current;
      // keepalive deixa o pedido terminar mesmo se a aba estiver fechando
      void fetch(`/api/books/${book.id}/progress`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page: current, totalPages: total }),
        keepalive,
      }).catch(() => undefined);
    },
    [book.id],
  );

  useEffect(() => {
    const timer = setTimeout(() => save(), SAVE_DELAY);
    return () => clearTimeout(timer);
  }, [page, numPages, save]);

  useEffect(() => {
    const flush = () => document.visibilityState === "hidden" && save(true);
    const leaving = () => save(true);
    document.addEventListener("visibilitychange", flush);
    window.addEventListener("pagehide", leaving);
    return () => {
      document.removeEventListener("visibilitychange", flush);
      window.removeEventListener("pagehide", leaving);
      save(true);
    };
  }, [save]);

  /* ---------- tocar numa palavra: definição, tradução e cartão ---------- */
  const closePopup = useCallback(() => {
    highlight(null);
    setTarget(null);
  }, []);

  const open = useCallback((next: Omit<LookupTarget, "id" | "viewport" | "page">) => {
    targetCounter.current += 1;
    setTarget({
      ...next,
      id: targetCounter.current,
      viewport: { width: window.innerWidth, height: window.innerHeight },
      page: latest.current.page,
    });
  }, []);

  function onPageUp(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const layer = textHolder.current?.firstElementChild;
    if (!layer) return;
    const { clientX, clientY } = event;

    // o navegador só atualiza a seleção depois do pointerup
    window.setTimeout(() => {
      const selection = window.getSelection();

      // arrastou: expressão selecionada
      if (selection && !selection.isCollapsed && selection.rangeCount > 0 && layer.contains(selection.anchorNode)) {
        const text = normalizeSelection(selection.toString());
        if (!text) return closePopup();
        const range = selection.getRangeAt(0);
        const page = readPageText(layer);
        const from = globalOffset(page, range.startContainer, range.startOffset);
        const to = globalOffset(page, range.endContainer, range.endOffset);
        const box = range.getBoundingClientRect();
        highlight(null);
        open({
          text,
          kind: /\s/.test(text) ? "phrase" : "word",
          sentence: from !== null && to !== null ? sentenceAround(page.text, from, to) : undefined,
          rect: { top: box.top, bottom: box.bottom, left: box.left, width: box.width },
        });
        return;
      }

      // só tocou: palavra sob o dedo
      const hit = wordAtPoint(layer, clientX, clientY);
      if (!hit) return closePopup();
      const sentence = sentenceAround(hit.page.text, hit.start, hit.end);
      const box = hit.range.getBoundingClientRect();
      // "The" no começo da frase vira "the"; nomes próprios no meio da frase mantêm a inicial
      const text = sentence.wordIndex === 0 && /^\p{Lu}\p{Ll}+$/u.test(hit.word) ? hit.word.toLowerCase() : hit.word;
      highlight(hit.range);
      if (hint === "show") setHint("hidden");
      open({
        text,
        kind: "word",
        sentence,
        rect: { top: box.top, bottom: box.bottom, left: box.left, width: box.width },
      });
    }, 0);
  }

  // fecha ao rolar, redimensionar ou sair da página
  useEffect(() => {
    if (!target) return;
    const stageElement = stage.current;
    stageElement?.addEventListener("scroll", closePopup, { passive: true });
    window.addEventListener("resize", closePopup);
    return () => {
      stageElement?.removeEventListener("scroll", closePopup);
      window.removeEventListener("resize", closePopup);
    };
  }, [target, closePopup]);

  useEffect(() => () => highlight(null), []);

  /* ---------- navegação ---------- */
  const go = useCallback(
    (target: number) => {
      if (!numPages) return;
      const next = Math.min(numPages, Math.max(1, Math.round(target)));
      closePopup();
      setPage(next);
      setPageInput(String(next));
    },
    [numPages, closePopup],
  );

  useEffect(() => {
    function onKeyDown(event: globalThis.KeyboardEvent) {
      if ((event.target as HTMLElement).closest("input, textarea, select")) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === "Escape") return closePopup();
      if (event.key === "ArrowRight" || event.key === "PageDown") go(latest.current.page + 1);
      else if (event.key === "ArrowLeft" || event.key === "PageUp") go(latest.current.page - 1);
      else if (event.key === "Home") go(1);
      else if (event.key === "End") go(latest.current.total);
      else return;
      event.preventDefault();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [go, closePopup]);

  function onPageInputKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      go(Number(pageInput) || page);
      event.currentTarget.blur();
    }
  }

  function stepZoom(direction: 1 | -1) {
    const index = ZOOMS.indexOf(zoomKey as (typeof ZOOMS)[number]);
    const next = ZOOMS[Math.min(ZOOMS.length - 1, Math.max(0, index + direction))];
    closePopup();
    setZoomKey(next);
  }

  const percent = numPages ? Math.round((page / numPages) * 100) : 0;
  const styles = THEME_STYLE[theme];

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 border-b-2 border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
          <Link
            href="/biblioteca"
            className="shrink-0 rounded-pill px-3 py-1.5 font-semibold text-muted transition-colors hover:bg-surface-soft hover:text-foreground"
          >
            <span aria-hidden>←</span>
            <span className="sr-only sm:not-sr-only"> Biblioteca</span>
          </Link>
          <div className="min-w-0 flex-1 basis-40">
            <h1 className="truncate font-display text-lg font-semibold leading-tight">{book.title}</h1>
            {book.author && <p className="truncate text-sm text-muted">{book.author}</p>}
          </div>

          {/* no celular o tema vira um botão que alterna, para a barra caber em duas linhas */}
          <button
            type="button"
            onClick={() => setTheme(THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length])}
            aria-label={`Tema de leitura: ${THEME_LABEL[theme]}. Tocar para trocar`}
            className="rounded-pill border-2 border-border bg-surface px-3 py-1 text-sm font-bold sm:hidden"
          >
            {THEME_LABEL[theme]}
          </button>

          <div className="flex items-center gap-1.5" role="group" aria-label="Navegação de páginas">
            <Button variant="ghost" className="h-9 px-3" onClick={() => go(page - 1)} disabled={page <= 1} aria-label="Página anterior">
              ‹
            </Button>
            <label className="flex items-center gap-1.5 text-sm font-semibold">
              <span className="sr-only">Ir para a página</span>
              <input
                value={pageInput}
                onChange={(event) => setPageInput(event.target.value.replace(/\D/g, ""))}
                onKeyDown={onPageInputKey}
                onBlur={() => setPageInput(String(page))}
                inputMode="numeric"
                className="h-9 w-14 rounded-xl border-2 border-border bg-surface text-center tabular-nums hover:border-sky focus-visible:border-sky focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky/30"
              />
              <span className="text-muted">/ {numPages || "…"}</span>
            </label>
            <Button variant="ghost" className="h-9 px-3" onClick={() => go(page + 1)} disabled={!numPages || page >= numPages} aria-label="Próxima página">
              ›
            </Button>
          </div>

          <div className="flex items-center gap-1.5" role="group" aria-label="Zoom">
            <Button variant="ghost" className="h-9 px-3" onClick={() => stepZoom(-1)} disabled={zoomKey === ZOOMS[0]} aria-label="Diminuir o zoom">
              −
            </Button>
            <span className="w-12 text-center text-sm font-semibold tabular-nums">{Math.round(zoom * 100)}%</span>
            <Button variant="ghost" className="h-9 px-3" onClick={() => stepZoom(1)} disabled={zoomKey === ZOOMS[ZOOMS.length - 1]} aria-label="Aumentar o zoom">
              +
            </Button>
          </div>

          <div role="radiogroup" aria-label="Tema de leitura" className="hidden gap-1 sm:flex">
            {THEMES.map((option) => (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={theme === option}
                onClick={() => setTheme(option)}
                className={cn(
                  "rounded-pill border-2 px-3 py-1 text-sm font-bold transition-colors",
                  theme === option
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-surface text-muted hover:border-sky hover:text-foreground",
                )}
              >
                {THEME_LABEL[option]}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div
        ref={stage}
        onPointerDown={(event) => {
          // clique fora da página (nas margens) fecha o popup
          if (!pageBox.current?.contains(event.target as Node)) closePopup();
        }}
        className={cn("relative flex-1 overflow-auto px-4 py-6 transition-colors duration-200", styles.stage)}
      >
        {state.kind === "error" ? (
          <div className="mx-auto mt-16 max-w-sm rounded-card border-2 border-border bg-surface p-6 text-center">
            <p className="font-display text-xl font-semibold">Ops!</p>
            <p className="mt-2 text-muted text-pretty">{state.message}</p>
            <Button className="mt-4" onClick={() => setAttempt((value) => value + 1)}>
              Tentar de novo
            </Button>
          </div>
        ) : (
          <>
            {(state.kind === "loading" || (rendering && !drawn)) && (
              <p role="status" className="mt-24 text-center font-semibold text-muted">
                {state.kind === "loading" ? "Carregando o livro…" : "Desenhando a página…"}
              </p>
            )}
            {hint === "show" && drawn && (
              <p className="mx-auto mb-4 flex max-w-md items-center justify-between gap-3 rounded-pill border-2 border-border bg-surface px-4 py-2 text-sm shadow-[0_3px_0_0_var(--color-border)]">
                <span>
                  <strong>Dica:</strong> toque numa palavra para ver o significado e salvar no Anki. Arraste para expressões.
                </span>
                <button type="button" onClick={() => setHint("hidden")} aria-label="Fechar dica" className="shrink-0 font-bold text-muted hover:text-foreground">
                  ×
                </button>
              </p>
            )}
            <div
              ref={pageBox}
              onPointerUp={onPageUp}
              className={cn("relative mx-auto bg-white shadow-xl transition-opacity duration-150", rendering && "opacity-70")}
              style={{ width: 0, height: 0 }}
            >
              <div ref={canvasHolder} style={{ filter: styles.filter }} />
              <div ref={textHolder} className="absolute inset-0" />
            </div>
          </>
        )}
      </div>

      {target && <WordPopup key={target.id} target={target} book={book} onClose={closePopup} />}

      <footer className="border-t-2 border-border bg-background/95 px-4 py-3">
        <div className="mx-auto flex max-w-3xl items-center gap-4">
          <label className="flex flex-1 items-center">
            <span className="sr-only">Percorrer o livro</span>
            <input
              type="range"
              min={1}
              max={Math.max(numPages, 1)}
              value={page}
              onChange={(event) => go(Number(event.target.value))}
              disabled={!numPages}
              className="w-full accent-primary"
            />
          </label>
          <span className="w-24 shrink-0 text-right text-sm font-semibold tabular-nums text-muted">{percent}% lido</span>
        </div>
      </footer>
    </div>
  );
}
