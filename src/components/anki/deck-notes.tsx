"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Mascot } from "@/components/mascot";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { api, ApiError } from "@/lib/api-client";
import {
  NOTE_TYPE_LABEL,
  type Note,
  type NotesPage,
  type NoteType,
} from "@/lib/anki-types";
import { cn } from "@/lib/cn";

const TYPES: NoteType[] = ["BASIC", "BASIC_REVERSED", "CLOZE"];

const TYPE_HELP: Record<NoteType, string> = {
  BASIC: "Frente → verso. Ideal para vocabulário.",
  BASIC_REVERSED: "Gera dois cartões: um em cada direção.",
  CLOZE: "Esconde uma palavra no meio da frase.",
};

const TYPE_BADGE: Record<NoteType, string> = {
  BASIC: "bg-sky-soft text-foreground",
  BASIC_REVERSED: "bg-lavender-soft text-foreground",
  CLOZE: "bg-butter-soft text-foreground",
};

const CLOZE_RE = /\{\{c(\d+)::([\s\S]+?)(?:::([\s\S]+?))?\}\}/g;

/** Texto de uma nota cloze com as lacunas destacadas (sempre como texto). */
function ClozePreview({ text }: { text: string }) {
  const parts: ReactNode[] = [];
  let cursor = 0;
  for (const match of text.matchAll(CLOZE_RE)) {
    if (match.index > cursor) parts.push(text.slice(cursor, match.index));
    parts.push(
      <mark
        key={match.index}
        className="rounded-md bg-primary-soft px-1 font-bold text-primary"
        title={`Lacuna ${match[1]}${match[3] ? ` · dica: ${match[3]}` : ""}`}
      >
        {match[2]}
      </mark>,
    );
    cursor = match.index + match[0].length;
  }
  if (cursor < text.length) parts.push(text.slice(cursor));
  return <>{parts}</>;
}

function searchable(note: Note) {
  const { front, back, text, extra } = note.fields;
  return [front, back, text, extra, ...note.tags].filter(Boolean).join(" ").toLowerCase();
}

export function DeckNotes({ deckId, initial }: { deckId: string; initial: NotesPage }) {
  const router = useRouter();
  const [notes, setNotes] = useState(initial.notes);
  const [cursor, setCursor] = useState(initial.nextCursor);
  const [type, setType] = useState<NoteType>("BASIC");
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [text, setText] = useState("");
  const [extra, setExtra] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string }>();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<NoteType | "ALL">("ALL");
  const clozeRef = useRef<HTMLTextAreaElement>(null);

  const isCloze = type === "CLOZE";
  const canSubmit = isCloze ? text.trim() : front.trim() && back.trim();

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return notes.filter(
      (note) => (filter === "ALL" || note.type === filter) && (!q || searchable(note).includes(q)),
    );
  }, [notes, query, filter]);

  /** Envolve o texto selecionado em {{cN::…}}; N = próxima lacuna (ou repete a última). */
  function wrapCloze(sameNumber: boolean) {
    const el = clozeRef.current;
    if (!el) return;
    const numbers = [...text.matchAll(/\{\{c(\d+)::/g)].map((m) => Number(m[1]));
    const highest = numbers.length ? Math.max(...numbers) : 0;
    const n = sameNumber && highest > 0 ? highest : highest + 1;
    const { selectionStart: from, selectionEnd: to } = el;
    const selected = text.slice(from, to) || "resposta";
    const wrapped = `{{c${n}::${selected}}}`;
    setText(`${text.slice(0, from)}${wrapped}${text.slice(to)}`);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(from + wrapped.length, from + wrapped.length);
    });
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setMessage(undefined);
    setFieldErrors({});
    try {
      const { note } = await api<{ note: Note }>("/anki/notes", {
        method: "POST",
        body: isCloze
          ? { type, deckId, text, extra: extra || undefined }
          : { type, deckId, front, back, extra: extra || undefined },
      });
      setNotes((current) => [note, ...current]);
      router.refresh(); // atualiza os contadores do cabeçalho
      setFront("");
      setBack("");
      setText("");
      setExtra("");
      setMessage({
        kind: "ok",
        text: `Pronto! ${note.cardCount} ${note.cardCount === 1 ? "cartão criado" : "cartões criados"}.`,
      });
      // volta o foco para o primeiro campo, para cadastrar vários cartões seguidos
      document.getElementById(isCloze ? "note-text" : "note-front")?.focus();
    } catch (e) {
      if (e instanceof ApiError && e.errors.length) {
        setFieldErrors(Object.fromEntries(e.errors.map((x) => [x.field, x.message])));
      } else {
        setMessage({ kind: "error", text: e instanceof ApiError ? e.message : "Não consegui salvar." });
      }
    } finally {
      setPending(false);
    }
  }

  async function remove(note: Note) {
    if (!window.confirm("Apagar esta nota e todos os cartões dela?")) return;
    try {
      await api(`/anki/notes/${note.id}`, { method: "DELETE" });
      setNotes((current) => current.filter((item) => item.id !== note.id));
      router.refresh();
    } catch (e) {
      setMessage({ kind: "error", text: e instanceof ApiError ? e.message : "Não consegui apagar." });
    }
  }

  async function loadMore() {
    if (!cursor) return;
    try {
      const page = await api<NotesPage>(`/anki/decks/${deckId}/notes?cursor=${cursor}`);
      setNotes((current) => [...current, ...page.notes]);
      setCursor(page.nextCursor);
    } catch (e) {
      setMessage({ kind: "error", text: e instanceof ApiError ? e.message : "Não consegui carregar mais." });
    }
  }

  const textareaClass =
    "min-h-24 rounded-2xl border-2 border-border bg-surface px-4 py-3 text-base text-foreground hover:border-sky focus-visible:border-sky focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky/30";

  return (
    <div className="grid gap-8 lg:grid-cols-[1.25fr_1fr] lg:items-start">
      {/* Formulário: no celular vem primeiro; no desktop fica à direita e acompanha a rolagem */}
      <section
        aria-labelledby="add-card"
        className="lg:sticky lg:top-6 lg:col-start-2 lg:row-start-1"
      >
        <Card tone="butter">
          <h2 id="add-card" className="font-display text-2xl font-semibold">
            Adicionar cartão
          </h2>

          <div role="radiogroup" aria-label="Tipo de cartão" className="mt-4 flex flex-wrap gap-2">
            {TYPES.map((option) => (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={type === option}
                onClick={() => setType(option)}
                className={cn(
                  "rounded-pill border-2 px-4 py-1.5 text-sm font-bold transition-colors",
                  type === option
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-surface hover:border-sky",
                )}
              >
                {NOTE_TYPE_LABEL[option]}
              </button>
            ))}
          </div>
          <p className="mt-2 text-sm text-muted">{TYPE_HELP[type]}</p>

          <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-4">
            {isCloze ? (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="note-text" className="font-display text-base font-semibold">
                  Texto
                </label>
                <textarea
                  id="note-text"
                  ref={clozeRef}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="I {{c1::went}} to the market yesterday."
                  maxLength={2000}
                  aria-invalid={fieldErrors.text ? true : undefined}
                  className={textareaClass}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <Button type="button" variant="ghost" onClick={() => wrapCloze(false)}>
                    Criar lacuna
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => wrapCloze(true)}>
                    Mesma lacuna
                  </Button>
                </div>
                <p className="text-sm text-muted">Selecione uma palavra no texto e clique em “Criar lacuna”.</p>
                {fieldErrors.text && (
                  <p className="text-sm font-semibold text-coral-edge">{fieldErrors.text}</p>
                )}
              </div>
            ) : (
              <>
                <Field
                  id="note-front"
                  label="Frente"
                  value={front}
                  onChange={(e) => setFront(e.target.value)}
                  placeholder="apple"
                  maxLength={2000}
                  error={fieldErrors.front}
                />
                <Field
                  id="note-back"
                  label="Verso"
                  value={back}
                  onChange={(e) => setBack(e.target.value)}
                  placeholder="maçã"
                  maxLength={2000}
                  error={fieldErrors.back}
                />
              </>
            )}

            <Field
              id="note-extra"
              label="Dica ou exemplo (opcional)"
              value={extra}
              onChange={(e) => setExtra(e.target.value)}
              placeholder="An apple a day keeps the doctor away."
              maxLength={2000}
            />

            <p
              role="status"
              className={cn(
                "min-h-5 text-sm font-semibold",
                message?.kind === "error" ? "text-coral-edge" : "text-primary",
              )}
            >
              {message?.text}
            </p>

            <Button type="submit" disabled={pending || !canSubmit}>
              {pending ? "Salvando…" : "Adicionar"}
            </Button>
          </form>
        </Card>
      </section>

      <section aria-labelledby="notes-title" className="lg:col-start-1 lg:row-start-1">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="notes-title" className="font-display text-2xl font-semibold">
            Cartões deste baralho
          </h2>
          <p className="text-sm text-muted">
            {visible.length === notes.length
              ? `${notes.length} ${notes.length === 1 ? "nota" : "notas"}`
              : `${visible.length} de ${notes.length}`}
            {cursor && "+"}
          </p>
        </div>

        {notes.length > 0 && (
          <div className="mt-4 flex flex-col gap-3">
            <div>
              <label htmlFor="notes-search" className="sr-only">
                Buscar nos cartões
              </label>
              <input
                id="notes-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por palavra, tradução ou dica…"
                className="h-12 w-full rounded-2xl border-2 border-border bg-surface px-4 text-base placeholder:text-muted/70 hover:border-sky focus-visible:border-sky focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky/30"
              />
            </div>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por tipo">
              {(["ALL", ...TYPES] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={filter === option}
                  onClick={() => setFilter(option)}
                  className={cn(
                    "rounded-pill border-2 px-3 py-1 text-sm font-bold transition-colors",
                    filter === option
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-surface text-muted hover:border-sky hover:text-foreground",
                  )}
                >
                  {option === "ALL" ? "Todos" : NOTE_TYPE_LABEL[option]}
                </button>
              ))}
            </div>
            {cursor && query.trim() && (
              <p className="text-sm text-muted">
                A busca olha só os cartões já carregados. Use “Carregar mais” para ampliar.
              </p>
            )}
          </div>
        )}

        {notes.length === 0 ? (
          <div className="mt-8 flex flex-col items-center rounded-card border-2 border-dashed border-border px-6 py-10 text-center">
            <Mascot className="w-28 motion-safe:animate-float" />
            <p className="mt-3 font-display text-xl font-semibold">Este baralho está vazio</p>
            <p className="mt-1 text-muted text-pretty">
              Adicione o primeiro cartão no formulário. Três ou quatro por dia já fazem diferença!
            </p>
          </div>
        ) : visible.length === 0 ? (
          <p className="mt-8 rounded-card border-2 border-dashed border-border px-6 py-8 text-center text-muted">
            Nenhum cartão encontrado. Tente outra palavra ou limpe o filtro.
          </p>
        ) : (
          <ul className="mt-5 flex flex-col gap-3">
            {visible.map((note) => (
              <li key={note.id}>
                <Card className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <span className={cn("rounded-pill px-3 py-0.5 text-xs font-bold", TYPE_BADGE[note.type])}>
                      {NOTE_TYPE_LABEL[note.type]} · {note.cardCount}{" "}
                      {note.cardCount === 1 ? "cartão" : "cartões"}
                    </span>
                    <button
                      type="button"
                      onClick={() => void remove(note)}
                      aria-label={`Apagar a nota ${note.fields.front ?? note.fields.text ?? ""}`}
                      className="shrink-0 rounded-pill px-3 py-1 text-sm font-semibold text-muted transition-colors hover:bg-coral-soft hover:text-foreground"
                    >
                      Apagar
                    </button>
                  </div>

                  {note.type === "CLOZE" ? (
                    <p className="mt-3 whitespace-pre-wrap break-words font-display text-xl leading-snug">
                      <ClozePreview text={note.fields.text ?? ""} />
                    </p>
                  ) : (
                    <div className="mt-3 grid gap-1 sm:grid-cols-2 sm:gap-4">
                      <p className="whitespace-pre-wrap break-words font-display text-xl font-semibold">
                        {note.fields.front}
                      </p>
                      <p className="whitespace-pre-wrap break-words text-lg text-muted">{note.fields.back}</p>
                    </div>
                  )}

                  {note.fields.extra && (
                    <p className="mt-3 whitespace-pre-wrap break-words rounded-xl bg-butter-soft px-3 py-2 text-sm">
                      <span className="mr-1.5 font-bold">Dica:</span>
                      {note.fields.extra}
                    </p>
                  )}
                </Card>
              </li>
            ))}
          </ul>
        )}

        {cursor && (
          <Button variant="ghost" className="mt-5" onClick={() => void loadMore()}>
            Carregar mais
          </Button>
        )}
      </section>
    </div>
  );
}
