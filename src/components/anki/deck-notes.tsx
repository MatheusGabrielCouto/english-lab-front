"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
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

function noteTitle(note: Note) {
  return (note.fields.front ?? note.fields.text ?? "").replace(/\{\{c\d+::(.+?)(?:::.+?)?\}\}/g, "[$1]");
}

export function DeckNotes({
  deckId,
  initial,
}: {
  deckId: string;
  initial: NotesPage;
}) {
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
  const clozeRef = useRef<HTMLTextAreaElement>(null);

  const isCloze = type === "CLOZE";
  const canSubmit = isCloze ? text.trim() : front.trim() && back.trim();

  /** Envolve o texto selecionado em {{cN::…}}; N = próxima lacuna (ou repete com Shift). */
  function wrapCloze(sameNumber: boolean) {
    const el = clozeRef.current;
    if (!el) return;
    const numbers = [...text.matchAll(/\{\{c(\d+)::/g)].map((m) => Number(m[1]));
    const highest = numbers.length ? Math.max(...numbers) : 0;
    const n = sameNumber && highest > 0 ? highest : highest + 1;
    const { selectionStart: from, selectionEnd: to } = el;
    const selected = text.slice(from, to) || "resposta";
    const next = `${text.slice(0, from)}{{c${n}::${selected}}}${text.slice(to)}`;
    setText(next);
    requestAnimationFrame(() => {
      el.focus();
      const end = from + `{{c${n}::${selected}}}`.length;
      el.setSelectionRange(end, end);
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
    <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
      <section aria-labelledby="add-card">
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
                  <span className="text-sm text-muted">Selecione uma palavra e clique.</span>
                </div>
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

      <section aria-labelledby="notes-title">
        <h2 id="notes-title" className="font-display text-2xl font-semibold">
          Cartões deste baralho
        </h2>
        {notes.length === 0 ? (
          <p className="mt-3 text-muted">Ainda não há nada por aqui. Adicione o primeiro ao lado!</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {notes.map((note) => (
              <li key={note.id}>
                <Card className="flex items-start justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="whitespace-pre-wrap break-words font-semibold">{noteTitle(note)}</p>
                    {note.fields.back && (
                      <p className="mt-0.5 whitespace-pre-wrap break-words text-muted">{note.fields.back}</p>
                    )}
                    <p className="mt-2 text-xs font-bold text-muted">
                      {NOTE_TYPE_LABEL[note.type]} · {note.cardCount}{" "}
                      {note.cardCount === 1 ? "cartão" : "cartões"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void remove(note)}
                    aria-label={`Apagar a nota ${noteTitle(note)}`}
                    className="shrink-0 rounded-pill px-3 py-1 text-sm font-semibold text-muted transition-colors hover:bg-coral-soft hover:text-foreground"
                  >
                    Apagar
                  </button>
                </Card>
              </li>
            ))}
          </ul>
        )}
        {cursor && (
          <Button variant="ghost" className="mt-4" onClick={() => void loadMore()}>
            Carregar mais
          </Button>
        )}
      </section>
    </div>
  );
}
