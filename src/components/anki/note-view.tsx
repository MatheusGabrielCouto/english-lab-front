import type { ReactNode } from "react";
import { NOTE_TYPE_LABEL, type Note, type NoteType } from "@/lib/anki-types";
import { cn } from "@/lib/cn";

export const TYPE_BADGE: Record<NoteType, string> = {
  BASIC: "bg-sky-soft text-foreground",
  BASIC_REVERSED: "bg-lavender-soft text-foreground",
  CLOZE: "bg-butter-soft text-foreground",
};

const CLOZE_RE = /\{\{c(\d+)::([\s\S]+?)(?:::([\s\S]+?))?\}\}/g;

/** Números das lacunas de um texto cloze. */
export function clozeNumbers(text: string) {
  return [...new Set([...text.matchAll(CLOZE_RE)].map((match) => Number(match[1])))].sort((a, b) => a - b);
}

/** Texto de uma nota cloze com as lacunas destacadas (sempre como texto, nunca HTML). */
export function ClozePreview({ text }: { text: string }) {
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

export function TypeBadge({ note, className }: { note: Pick<Note, "type" | "cardCount">; className?: string }) {
  return (
    <span className={cn("rounded-pill px-3 py-0.5 text-xs font-bold", TYPE_BADGE[note.type], className)}>
      {NOTE_TYPE_LABEL[note.type]} · {note.cardCount} {note.cardCount === 1 ? "cartão" : "cartões"}
    </span>
  );
}

/** Conteúdo de uma nota: frente/verso (ou texto cloze), dica e tags. */
export function NoteContent({ note }: { note: Note }) {
  return (
    <>
      {note.type === "CLOZE" ? (
        <p className="mt-3 whitespace-pre-wrap break-words font-display text-xl leading-snug">
          <ClozePreview text={note.fields.text ?? ""} />
        </p>
      ) : (
        <div className="mt-3 grid gap-1 sm:grid-cols-2 sm:gap-4">
          <p className="whitespace-pre-wrap break-words font-display text-xl font-semibold">{note.fields.front}</p>
          <p className="whitespace-pre-wrap break-words text-lg text-muted">{note.fields.back}</p>
        </div>
      )}

      {note.fields.extra && (
        <p className="mt-3 whitespace-pre-wrap break-words rounded-xl bg-butter-soft px-3 py-2 text-sm">
          <span className="mr-1.5 font-bold">Dica:</span>
          {note.fields.extra}
        </p>
      )}

      {note.tags.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Tags">
          {note.tags.map((tag) => (
            <li key={tag} className="rounded-pill bg-surface-soft px-2.5 py-0.5 text-xs font-semibold text-muted">
              #{tag}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

/** Texto curto para identificar a nota em rótulos de acessibilidade. */
export function noteLabel(note: Note) {
  return (note.fields.front ?? note.fields.text ?? "").replace(/\{\{c\d+::([\s\S]+?)(?:::[\s\S]+?)?\}\}/g, "[$1]").slice(0, 60);
}
