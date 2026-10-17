"use client";

import Link from "next/link";
import { useEffect, useEffectEvent, useMemo, useState, type CSSProperties } from "react";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api-client";
import type { Deck, Note } from "@/lib/anki-types";
import type { Book } from "@/lib/book-types";
import { cn } from "@/lib/cn";
import type { LookupResult } from "@/lib/dictionary-types";
import type { SentenceMatch } from "@/lib/reading-context";
import { speak, useEnglishVoices, useSpeechSettings } from "@/lib/speech";
import { useLocalSetting } from "@/lib/use-local-setting";
import { buildNote, canBuild, coversWord, type WordCardKind } from "@/lib/word-cards";

export type LookupTarget = {
  /** muda a cada toque: o popup é recriado */
  id: number;
  text: string;
  kind: "word" | "phrase";
  sentence?: SentenceMatch;
  /** retângulo da palavra na janela */
  rect: { top: number; bottom: number; left: number; width: number };
  viewport: { width: number; height: number };
  page: number;
};

type State = { status: "loading" } | { status: "ready"; data: LookupResult } | { status: "error" };

const SHEET_BREAKPOINT = 640;
const POPUP_WIDTH = 352;

/* Cache da sessão: tocar a mesma palavra de novo é instantâneo. */
const lookupCache = new Map<string, LookupResult>();
let decksRequest: Promise<Deck[]> | null = null;
const loadDecks = () => (decksRequest ??= api<{ decks: Deck[] }>("/anki/decks").then((r) => r.decks).catch((error) => {
  decksRequest = null;
  throw error;
}));

const CARD_TYPES = ["word", "cloze"] as const;

export function WordPopup({
  target,
  book,
  onClose,
}: {
  target: LookupTarget;
  book: Pick<Book, "id" | "title" | "level">;
  onClose: () => void;
}) {
  const cacheKey = `${target.text.toLowerCase()}|${target.sentence?.sentence ?? ""}`;
  const [state, setState] = useState<State>(() => {
    const cached = lookupCache.get(cacheKey);
    return cached ? { status: "ready", data: cached } : { status: "loading" };
  });
  const [attempt, setAttempt] = useState(0);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [existing, setExisting] = useState<Note[]>([]);
  const [cardType, setCardType] = useLocalSetting<(typeof CARD_TYPES)[number]>("reader-card-type", "word", CARD_TYPES);
  const [deckChoice, setDeckChoice] = useLocalSetting<string>("reader-deck", "auto");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<{ deckId: string; deckName: string }>();
  const [error, setError] = useState<string>();
  const [showMore, setShowMore] = useState(false);
  const [editDeck, setEditDeck] = useState(false);

  const voices = useEnglishVoices();
  const [speech] = useSpeechSettings();

  /* ---------- busca: definição + tradução ---------- */
  useEffect(() => {
    if (lookupCache.has(cacheKey)) return;
    let cancelled = false;
    const params = new URLSearchParams({ text: target.text });
    if (target.sentence?.sentence) params.set("context", target.sentence.sentence);

    api<LookupResult>(`/dictionary/lookup?${params}`)
      .then((data) => {
        if (cancelled) return;
        lookupCache.set(cacheKey, data);
        setState({ status: "ready", data });
      })
      .catch(() => !cancelled && setState({ status: "error" }));
    return () => {
      cancelled = true;
    };
  }, [cacheKey, target.text, target.sentence, attempt]);

  /* ---------- baralhos do usuário e cartões que já existem ---------- */
  useEffect(() => {
    let cancelled = false;
    loadDecks().then((list) => !cancelled && setDecks(list)).catch(() => undefined);
    if (target.kind === "word") {
      api<{ notes: Note[] }>(`/anki/notes?${new URLSearchParams({ q: target.text, limit: "30" })}`)
        .then((result) => !cancelled && setExisting(result.notes))
        .catch(() => undefined);
    }
    return () => {
      cancelled = true;
    };
  }, [target.kind, target.text]);

  const data = state.status === "ready" ? state.data : null;
  const hasSentence = Boolean(target.sentence?.sentence);
  const kind: WordCardKind = target.kind === "word" && cardType === "cloze" && hasSentence ? "cloze" : "word";
  const cardInput = { kind, text: target.text, sentence: target.sentence, lookup: data, book, page: target.page };
  const buildable = state.status === "ready" && canBuild(cardInput);
  const deckValue = deckChoice === "auto" || decks.some((deck) => deck.id === deckChoice) ? deckChoice : "auto";
  const autoDeckName = `Livros › ${book.title}`;
  const currentDeckName =
    deckValue === "auto" ? autoDeckName : (decks.find((deck) => deck.id === deckValue)?.fullName.split("::").join(" › ") ?? autoDeckName);

  const alreadyHave = useMemo(() => {
    return existing.filter((note) => coversWord(note.fields, target.text));
  }, [existing, target.text]);

  async function add() {
    if (!buildable) return;
    setSaving(true);
    setError(undefined);
    try {
      const note = buildNote(cardInput);
      let deckId = deckValue;
      let deckName = decks.find((deck) => deck.id === deckValue)?.fullName.split("::").join(" › ") ?? "";
      if (deckValue === "auto") {
        const title = book.title.replace(/::/g, "-").trim().slice(0, 80) || "Livro";
        const { deck } = await api<{ deck: { id: string } }>("/anki/decks/ensure", {
          method: "POST",
          body: { names: ["Livros", title] },
        });
        deckId = deck.id;
        deckName = autoDeckName;
        decksRequest = null; // o baralho novo passa a aparecer na lista
      }
      await api("/anki/notes", { method: "POST", body: { ...note, deckId } });
      setSaved({ deckId, deckName });
    } catch (e) {
      setError(e instanceof ApiError ? (e.errors[0]?.message ?? e.message) : "Não consegui salvar o cartão.");
    } finally {
      setSaving(false);
    }
  }

  /* ---------- posição: abaixo da palavra se couber, senão acima (ou folha no celular) ---------- */
  const sheet = target.viewport.width < SHEET_BREAKPOINT;
  const style: CSSProperties = sheet
    ? { maxHeight: "82dvh" }
    : (() => {
        const { rect, viewport } = target;
        const width = Math.min(POPUP_WIDTH, viewport.width - 16);
        const left = Math.min(Math.max(8, rect.left + rect.width / 2 - width / 2), viewport.width - width - 8);
        const below = viewport.height - rect.bottom - 16;
        const above = rect.top - 16;
        return below >= 360 || below >= above
          ? { left, width, top: rect.bottom + 8, maxHeight: below }
          : { left, width, bottom: viewport.height - rect.top + 8, maxHeight: above };
      })();

  const meanings = data?.lemma?.meanings.length ? data.lemma.meanings : (data?.meanings ?? []);
  const phonetic = data?.phonetic ?? data?.lemma?.phonetic;
  const sentence = target.sentence;

  // recolhido: 2 classes gramaticais × 1 definição; aberto: tudo (até 4 por classe), com exemplos
  const shownMeanings = showMore ? meanings : meanings.slice(0, 2);
  const hiddenCount =
    meanings.reduce((sum, meaning) => sum + Math.min(meaning.definitions.length, 4), 0) -
    shownMeanings.reduce((sum, meaning) => sum + (showMore ? Math.min(meaning.definitions.length, 4) : 1), 0);

  // Enter adiciona (a não ser que o foco esteja num botão, link ou lista)
  const onEnter = useEffectEvent((event: KeyboardEvent) => {
    const el = event.target;
    if (el instanceof HTMLElement && el.closest("button, a, select, input, textarea")) return;
    if (!saved && buildable && !saving) {
      event.preventDefault();
      void add();
    }
  });
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Enter" && onEnter(event);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const speakable = voices.length > 0;
  const pronunciation = phonetic ? (
    <span className="font-mono text-sm">{phonetic}</span>
  ) : null;

  return (
    <div
      role="dialog"
      aria-label={`Significado de ${target.text}`}
      onPointerDown={(event) => event.stopPropagation()}
      className={cn(
        "fixed z-40 flex flex-col overflow-hidden border-2 border-border bg-surface shadow-2xl",
        sheet
          ? "inset-x-0 bottom-0 rounded-t-card border-b-0 motion-safe:animate-[sheet-in_180ms_ease-out]"
          : "rounded-card motion-safe:animate-[popup-in_140ms_ease-out]",
      )}
      style={style}
    >
      {sheet && <span aria-hidden className="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-pill bg-border" />}

      {/* cabeçalho: a palavra com a pronúncia ao lado (toque para ouvir) e fechar */}
      <header className="flex shrink-0 items-start justify-between gap-3 px-4 pt-3 pb-2">
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
          <h2 className="break-words font-display text-2xl leading-tight font-semibold">{target.text}</h2>
          {speakable ? (
            <button
              type="button"
              onClick={() => speak(target.text, speech, voices)}
              aria-label={`Ouvir “${target.text}” em inglês`}
              className="inline-flex items-center gap-1.5 rounded-pill bg-sky-soft px-2.5 py-0.5 text-sm font-semibold transition-colors hover:bg-sky/40"
            >
              <span aria-hidden>🔊</span>
              {pronunciation ?? <span>Ouvir</span>}
            </button>
          ) : (
            pronunciation && <span className="text-muted">{pronunciation}</span>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="grid size-8 shrink-0 place-items-center rounded-pill text-xl font-bold text-muted transition-colors hover:bg-surface-soft hover:text-foreground"
        >
          ×
        </button>
      </header>

      {/* corpo: rola quando o conteúdo é grande; o rodapé não sai do lugar */}
      <div className="scroll-soft min-h-0 flex-1 overflow-y-auto pr-1.5 pl-4 pb-3">
        {state.status === "loading" && (
          <div role="status" aria-label="Buscando" className="mt-2 flex flex-col gap-2">
            <div className="h-16 animate-pulse rounded-2xl bg-surface-soft" />
            <div className="h-4 w-full animate-pulse rounded-lg bg-surface-soft" />
            <div className="h-4 w-5/6 animate-pulse rounded-lg bg-surface-soft" />
          </div>
        )}

        {state.status === "error" && (
          <div role="alert" className="mt-2 rounded-2xl bg-coral-soft p-3 text-sm">
            <p className="font-semibold">Não consegui buscar agora.</p>
            <Button
              variant="ghost"
              className="mt-2 h-9 px-4 text-sm"
              onClick={() => {
                setState({ status: "loading" });
                setAttempt((n) => n + 1);
              }}
            >
              Tentar de novo
            </Button>
          </div>
        )}

        {data && (
          <>
            {/* tradução em destaque */}
            <section aria-label="Tradução" className="rounded-2xl bg-primary-soft px-4 py-2.5">
              {data.translation ? (
                <>
                  <p className="font-display text-2xl leading-tight font-semibold text-balance">{data.translation.text}</p>
                  {data.translation.note && <p className="mt-1.5 text-sm text-pretty">{data.translation.note}</p>}
                </>
              ) : (
                <p className="text-sm text-muted">Tradução indisponível agora.</p>
              )}
              {data.lemma && (
                <p className="mt-2 inline-block rounded-pill bg-surface px-3 py-0.5 text-xs font-bold text-muted">
                  forma de <span className="text-foreground">{data.lemma.word}</span>
                </p>
              )}
            </section>

            {/* a frase do livro, com a palavra marcada, e o sentido nela */}
            {sentence && (
              <figure className="mt-3">
                <figcaption className="mb-1 text-xs font-bold tracking-wide text-muted uppercase">No livro</figcaption>
                <blockquote className="rounded-2xl bg-surface-soft px-3 py-2.5 text-sm leading-relaxed">
                  {sentence.sentence.slice(0, sentence.wordIndex)}
                  <mark className="rounded bg-butter px-0.5 text-ink">
                    {sentence.sentence.slice(sentence.wordIndex, sentence.wordIndex + target.text.length)}
                  </mark>
                  {sentence.sentence.slice(sentence.wordIndex + target.text.length)}
                </blockquote>
                {data.translation?.definition && (
                  <p className="mt-1.5 text-sm text-muted">
                    <span className="font-semibold text-foreground">Aqui:</span> {data.translation.definition}
                  </p>
                )}
              </figure>
            )}

            {/* dicionário */}
            {meanings.length > 0 ? (
              <section aria-label="Definições" className="mt-4">
                <ul className="flex flex-col gap-3">
                  {shownMeanings.map((meaning) => (
                    <li key={meaning.partOfSpeech}>
                      <p className="inline-block rounded-pill bg-lavender-soft px-2.5 py-0.5 text-xs font-bold tracking-wide uppercase">
                        {meaning.partOfSpeech}
                      </p>
                      <ol className="mt-1 list-decimal pl-5 text-sm marker:text-muted">
                        {meaning.definitions.slice(0, showMore ? 4 : 1).map((definition) => (
                          <li key={definition.definition} className="mt-1 text-pretty">
                            {definition.definition}
                            {showMore && definition.example && (
                              <span className="block text-muted italic">“{definition.example}”</span>
                            )}
                          </li>
                        ))}
                      </ol>
                    </li>
                  ))}
                </ul>
                {(hiddenCount > 0 || showMore) && (
                  <button
                    type="button"
                    onClick={() => setShowMore((value) => !value)}
                    aria-expanded={showMore}
                    className="mt-3 text-sm font-bold text-primary underline-offset-4 hover:underline"
                  >
                    {showMore ? "Mostrar menos" : `Mais definições (${hiddenCount})`}
                  </button>
                )}
              </section>
            ) : (
              data.kind === "word" && (
                <p className="mt-4 text-sm text-muted">
                  {data.status.dictionary === "unavailable"
                    ? "O dicionário está fora do ar no momento."
                    : "Não encontrei esta palavra no dicionário."}
                </p>
              )
            )}
          </>
        )}
      </div>

      {/* Anki: sempre à vista, mesmo com o corpo rolando */}
      {data && (
        <footer
          aria-label="Adicionar ao Anki"
          className="shrink-0 border-t-2 border-border bg-surface px-4 pt-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
        >
          {saved ? (
            <div role="status" className="flex items-center justify-between gap-3 rounded-2xl bg-primary-soft px-4 py-3">
              <div className="min-w-0">
                <p className="font-display text-lg leading-tight font-semibold">Adicionado ao Anki ✓</p>
                <p className="truncate text-sm text-muted">{saved.deckName}</p>
              </div>
              <Link
                href={`/anki/baralho/${saved.deckId}`}
                target="_blank"
                className="shrink-0 text-sm font-bold text-primary underline-offset-4 hover:underline"
              >
                Ver baralho
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {alreadyHave.length > 0 && (
                <p className="rounded-2xl bg-butter-soft px-3 py-1.5 text-sm">
                  Você já tem {alreadyHave.length === 1 ? "um cartão" : `${alreadyHave.length} cartões`} com esta palavra.
                </p>
              )}

              {target.kind === "word" && hasSentence && (
                <div role="radiogroup" aria-label="Tipo de cartão" className="grid grid-cols-2 gap-1 rounded-pill bg-surface-soft p-0.5">
                  {CARD_TYPES.map((option) => (
                    <button
                      key={option}
                      type="button"
                      role="radio"
                      aria-checked={kind === option}
                      onClick={() => setCardType(option)}
                      className={cn(
                        "rounded-pill px-3 py-1 text-sm font-bold transition-colors",
                        kind === option ? "bg-foreground text-background" : "text-muted hover:text-foreground",
                      )}
                    >
                      {option === "word" ? "Palavra" : "Lacuna na frase"}
                    </button>
                  ))}
                </div>
              )}

              <Button className="w-full" onClick={() => void add()} disabled={saving || !buildable}>
                {saving ? "Salvando…" : "Adicionar ao Anki"}
              </Button>

              {error && (
                <p role="alert" className="text-sm font-semibold text-coral-edge">
                  {error}
                </p>
              )}
              {!buildable && state.status === "ready" && (
                <p className="text-center text-xs text-muted">
                  {kind === "cloze" ? "Não achei a frase para criar a lacuna." : "Sem tradução nem definição para o verso."}
                </p>
              )}

              {/* baralho: uma linha discreta; só abre o seletor se você quiser trocar */}
              <div className="text-xs text-muted">
                {editDeck ? (
                  <label className="flex flex-col gap-1 font-semibold">
                    Baralho
                    <select
                      value={deckValue}
                      onChange={(event) => setDeckChoice(event.target.value)}
                      className="h-10 rounded-xl border-2 border-border bg-surface px-3 font-normal text-foreground hover:border-sky focus-visible:border-sky focus-visible:ring-4 focus-visible:ring-sky/30 focus-visible:outline-none"
                    >
                      <option value="auto">{autoDeckName}</option>
                      {decks.map((deck) => (
                        <option key={deck.id} value={deck.id}>
                          {deck.fullName.split("::").join(" › ")}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : (
                  <p className="flex items-center justify-between gap-2">
                    <span className="min-w-0 truncate">
                      Em: <span className="font-semibold text-foreground">{currentDeckName}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditDeck(true)}
                      className="shrink-0 font-bold text-primary underline-offset-4 hover:underline"
                    >
                      trocar
                    </button>
                  </p>
                )}
              </div>
            </div>
          )}
        </footer>
      )}
    </div>
  );
}
