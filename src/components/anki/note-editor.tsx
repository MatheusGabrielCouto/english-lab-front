"use client";

import { useState, type FormEvent } from "react";
import { clozeNumbers } from "@/components/anki/note-view";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { api, ApiError } from "@/lib/api-client";
import type { Note } from "@/lib/anki-types";

const TEXTAREA =
  "min-h-24 rounded-2xl border-2 border-border bg-surface px-4 py-3 text-base text-foreground hover:border-sky focus-visible:border-sky focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky/30";

/** Edição de uma nota no próprio lugar. O tipo da nota não muda. */
export function NoteEditor({
  note,
  decks,
  onSaved,
  onCancel,
}: {
  note: Note;
  /** com a lista, aparece o seletor para mover a nota de baralho */
  decks?: { id: string; fullName: string }[];
  onSaved: (note: Note) => void;
  onCancel: () => void;
}) {
  const isCloze = note.type === "CLOZE";
  const [front, setFront] = useState(note.fields.front ?? "");
  const [back, setBack] = useState(note.fields.back ?? "");
  const [text, setText] = useState(note.fields.text ?? "");
  const [extra, setExtra] = useState(note.fields.extra ?? "");
  const [tags, setTags] = useState(note.tags.join(" "));
  const [deckId, setDeckId] = useState(note.deckId);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // lacunas que existiam e sumiram: os cartões delas (e o histórico) serão apagados
  const removed = isCloze
    ? clozeNumbers(note.fields.text ?? "").filter((n) => !clozeNumbers(text).includes(n))
    : [];

  async function save(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(undefined);
    setFieldErrors({});
    try {
      const { note: saved } = await api<{ note: Note }>(`/anki/notes/${note.id}`, {
        method: "PATCH",
        body: {
          ...(isCloze ? { text } : { front, back }),
          extra,
          tags: tags.split(/[\s,;]+/).filter(Boolean),
          ...(deckId !== note.deckId && { deckId }),
        },
      });
      onSaved(saved);
    } catch (e) {
      if (e instanceof ApiError && e.errors.length > 0) {
        setFieldErrors(Object.fromEntries(e.errors.map((x) => [x.field, x.message])));
      } else {
        setError(e instanceof ApiError ? e.message : "Não consegui salvar. Tente de novo.");
      }
    } finally {
      setPending(false);
    }
  }

  const id = `edit-${note.id}`;

  return (
    <form onSubmit={save} className="mt-3 flex flex-col gap-4">
      {isCloze ? (
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-text`} className="font-display text-base font-semibold">
            Texto
          </label>
          <textarea
            id={`${id}-text`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={2000}
            aria-invalid={fieldErrors.text ? true : undefined}
            className={TEXTAREA}
          />
          {fieldErrors.text && <p className="text-sm font-semibold text-coral-edge">{fieldErrors.text}</p>}
          {removed.length > 0 && (
            <p role="status" className="rounded-xl bg-coral-soft px-3 py-2 text-sm font-semibold">
              {removed.length === 1 ? "A lacuna" : "As lacunas"} {removed.map((n) => `c${n}`).join(", ")}{" "}
              {removed.length === 1 ? "foi removida" : "foram removidas"}: o cartão correspondente e o histórico
              dele serão apagados ao salvar.
            </p>
          )}
        </div>
      ) : (
        <>
          <Field id={`${id}-front`} label="Frente" value={front} onChange={(e) => setFront(e.target.value)} maxLength={2000} error={fieldErrors.front} />
          <Field id={`${id}-back`} label="Verso" value={back} onChange={(e) => setBack(e.target.value)} maxLength={2000} error={fieldErrors.back} />
        </>
      )}

      <Field
        id={`${id}-extra`}
        label="Dica ou exemplo (opcional)"
        value={extra}
        onChange={(e) => setExtra(e.target.value)}
        maxLength={2000}
      />
      <Field
        id={`${id}-tags`}
        label="Tags (opcional)"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        placeholder="verbo a1 viagem"
        hint="Separe com espaço ou vírgula."
      />

      {decks && decks.length > 1 && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-deck`} className="font-display text-base font-semibold">
            Baralho
          </label>
          <select
            id={`${id}-deck`}
            value={deckId}
            onChange={(e) => setDeckId(e.target.value)}
            className="h-12 rounded-2xl border-2 border-border bg-surface px-4 text-base hover:border-sky focus-visible:border-sky focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky/30"
          >
            {decks.map((deck) => (
              <option key={deck.id} value={deck.id}>
                {deck.fullName.split("::").join(" › ")}
              </option>
            ))}
          </select>
        </div>
      )}

      <p role="alert" className="min-h-5 text-sm font-semibold text-coral-edge">
        {error}
      </p>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando…" : "Salvar"}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={pending}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
