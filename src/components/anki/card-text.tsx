import { cn } from "@/lib/cn";
import type { Part } from "@/lib/anki-types";

/** Texto de um lado do cartão. Sempre texto puro: nada de HTML vindo do conteúdo. */
export function CardText({ parts, className }: { parts: Part[]; className?: string }) {
  return (
    <p className={cn("whitespace-pre-wrap text-balance font-display text-3xl font-medium leading-snug", className)}>
      {parts.map((part, index) =>
        part.hidden ? (
          <span
            key={index}
            className="rounded-lg border-2 border-dashed border-sky bg-sky-soft px-2 text-sky-edge"
          >
            {part.text}
          </span>
        ) : part.highlight ? (
          <span key={index} className="rounded-lg bg-primary-soft px-1.5 font-bold text-primary">
            {part.text}
          </span>
        ) : (
          <span key={index}>{part.text}</span>
        ),
      )}
    </p>
  );
}

/** Texto para ler em voz alta; esconde as lacunas ainda não reveladas. */
export function spokenText(parts: Part[]) {
  return parts
    .filter((part) => !part.hidden)
    .map((part) => part.text)
    .join("");
}
