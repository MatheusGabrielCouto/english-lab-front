"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
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
    ? { maxHeight: "78dvh" }
    : (() => {
        const { rect, viewport } = target;
        const width = Math.min(POPUP_WIDTH, viewport.width - 16);
        const left = Math.min(Math.max(8, rect.left + rect.width / 2 - width / 2), viewport.width - width - 8);
        const below = viewport.height - rect.bottom - 16;
        const above = rect.top - 16;
        return below >= 320 || below >= above
          ? { left, width, top: rect.bottom + 8, maxHeight: below }
          : { left, width, bottom: viewport.height - rect.top + 8, maxHeight: above };
      })();

  const meanings = data?.lemma?.meanings.length ? data.lemma.meanings : (data?.meanings ?? []);
  const phonetic = data?.phonetic ?? data?.lemma?.phonetic;
  const sentence = target.sentence;

  return (
    <div
      role="dialog"
      aria-label={`Significado de ${target.text}`}
      onPointerDown={(event) => event.stopPropagation()}
      className={cn(
        "fixed z-40 flex flex-col overflow-y-auto border-2 border-border bg-surface p-4 shadow-2xl",
        sheet ? "inset-x-0 bottom-0 rounded-t-card border-b-0" : "rounded-card",
      )}
      style={style}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="break-words font-display text-2xl font-semibold leading-tight">{target.text}</h2>
          {phonetic && <p className="mt-0.5 text-sm text-muted">{phonetic}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {voices.length > 0 && (
            <button
              type="button"
              onClick={() => speak(target.text, speech, voices)}
              aria-label={`Ouvir “${target.text}” em inglês`}
              className="grid size-9 place-items-center rounded-pill text-lg transition-colors hover:bg-surface-soft"
            >
              <span aria-hidden>🔊</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="grid size-9 place-items-center rounded-pill text-lg font-bold text-muted transition-colors hover:bg-surface-soft hover:text-foreground"
          >
            ×
          </button>
        </div>
      </div>

      {state.status === "loading" && (
        <div role="status" aria-label="Buscando" className="mt-4 flex flex-col gap-2">
          <div className="h-7 w-2/3 animate-pulse rounded-lg bg-surface-soft" />
          <div className="h-4 w-full animate-pulse rounded-lg bg-surface-soft" />
          <div className="h-4 w-5/6 animate-pulse rounded-lg bg-surface-soft" />
        </div>
      )}

      {state.status === "error" && (
        <div role="alert" className="mt-4 rounded-2xl bg-coral-soft p-3 text-sm">
          <p className="font-semibold">Não consegui buscar agora.</p>
          <Button variant="ghost" className="mt-2 h-9 px-4 text-sm" onClick={() => { setState({ status: "loading" }); setAttempt((n) => n + 1); }}>
            Tentar de novo
          </Button>
        </div>
      )}

      {data && (
        <>
          {/* tradução */}
          <section className="mt-3">
            {data.translation ? (
              <>
                <p className="font-display text-xl font-semibold text-primary">{data.translation.text}</p>
                {data.translation.note && <p className="mt-1 text-sm">{data.translation.note}</p>}
                {data.translation.definition && (
                  <p className="mt-1 text-sm text-muted">
                    <span className="font-semibold text-foreground">Aqui:</span> {data.translation.definition}
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-muted">Tradução indisponível agora.</p>
            )}
          </section>

          {/* dicionário */}
          {data.lemma && (
            <p className="mt-3 rounded-2xl bg-lavender-soft px-3 py-1.5 text-sm">
              Forma de <strong>{data.lemma.word}</strong>
            </p>
          )}
          {meanings.length > 0 ? (
            <ul className="mt-3 flex flex-col gap-2.5">
              {meanings.map((meaning) => (
                <li key={meaning.partOfSpeech}>
                  <p className="text-xs font-bold uppercase tracking-wide text-muted">{meaning.partOfSpeech}</p>
                  <ol className="mt-0.5 list-decimal pl-5 text-sm">
                    {meaning.definitions.slice(0, 2).map((definition) => (
                      <li key={definition.definition} className="mt-0.5">
                        {definition.definition}
                        {definition.example && <span className="block italic text-muted">“{definition.example}”</span>}
                      </li>
                    ))}
                  </ol>
                </li>
              ))}
            </ul>
          ) : (
            data.kind === "word" && (
              <p className="mt-3 text-sm text-muted">
                {data.status.dictionary === "unavailable"
                  ? "O dicionário está fora do ar no momento."
                  : "Não encontrei esta palavra no dicionário."}
              </p>
            )
          )}

          {/* a frase do livro */}
          {sentence && (
            <blockquote className="mt-3 rounded-2xl bg-surface-soft px-3 py-2 text-sm">
              {sentence.sentence.slice(0, sentence.wordIndex)}
              <mark className="rounded bg-butter px-0.5 text-ink">
                {sentence.sentence.slice(sentence.wordIndex, sentence.wordIndex + target.text.length)}
              </mark>
              {sentence.sentence.slice(sentence.wordIndex + target.text.length)}
            </blockquote>
          )}

          {/* Anki */}
          <section aria-label="Adicionar ao Anki" className="mt-4 border-t-2 border-border pt-3">
            {saved ? (
              <div role="status" className="rounded-2xl bg-primary-soft px-3 py-3">
                <p className="font-display text-lg font-semibold">Adicionado ao Anki! ✓</p>
                <p className="mt-0.5 text-sm text-muted">{saved.deckName}</p>
                <Link href={`/anki/baralho/${saved.deckId}`} target="_blank" className="mt-1 inline-block text-sm font-bold text-primary underline-offset-4 hover:underline">
                  Ver o baralho
                </Link>
              </div>
            ) : (
              <>
                {alreadyHave.length > 0 && (
                  <p className="mb-2 rounded-2xl bg-butter-soft px-3 py-1.5 text-sm">
                    Você já tem {alreadyHave.length === 1 ? "um cartão" : `${alreadyHave.length} cartões`} com esta palavra.
                  </p>
                )}

                {target.kind === "word" && hasSentence && (
                  <div role="radiogroup" aria-label="Tipo de cartão" className="mb-2 flex gap-1.5">
                    {CARD_TYPES.map((option) => (
                      <button
                        key={option}
                        type="button"
                        role="radio"
                        aria-checked={kind === option}
                        onClick={() => setCardType(option)}
                        className={cn(
                          "flex-1 rounded-pill border-2 px-3 py-1 text-sm font-bold transition-colors",
                          kind === option
                            ? "border-foreground bg-foreground text-background"
                            : "border-border bg-surface text-muted hover:border-sky hover:text-foreground",
                        )}
                      >
                        {option === "word" ? "Palavra" : "Lacuna na frase"}
                      </button>
                    ))}
                  </div>
                )}

                <label className="flex flex-col gap-1 text-sm font-semibold">
                  Baralho
                  <select
                    value={deckValue}
                    onChange={(event) => setDeckChoice(event.target.value)}
                    className="h-10 rounded-xl border-2 border-border bg-surface px-3 font-normal hover:border-sky focus-visible:border-sky focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky/30"
                  >
                    <option value="auto">{autoDeckName}</option>
                    {decks.map((deck) => (
                      <option key={deck.id} value={deck.id}>
                        {deck.fullName.split("::").join(" › ")}
                      </option>
                    ))}
                  </select>
                </label>

                <p role="alert" className="mt-1 min-h-5 text-sm font-semibold text-coral-edge">
                  {error}
                </p>
                <Button className="w-full" onClick={() => void add()} disabled={saving || !buildable}>
                  {saving ? "Salvando…" : "Adicionar ao Anki"}
                </Button>
                {!buildable && state.status === "ready" && (
                  <p className="mt-1 text-center text-xs text-muted">
                    {kind === "cloze" ? "Não achei a frase para criar a lacuna." : "Sem tradução nem definição para o verso."}
                  </p>
                )}
              </>
            )}
          </section>
        </>
      )}
    </div>
  );
}
