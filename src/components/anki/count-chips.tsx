import { cn } from "@/lib/cn";
import type { DeckCounts } from "@/lib/anki-types";

const chips = [
  { key: "new", label: "Novos", on: "bg-sky-soft text-foreground border-sky/50" },
  { key: "learning", label: "Aprender", on: "bg-coral-soft text-foreground border-coral/50" },
  { key: "review", label: "Revisar", on: "bg-primary-soft text-foreground border-primary/40" },
] as const;

/** Novos / Aprender / Revisar, como no Anki. `active` realça o tipo do cartão atual. */
export function CountChips({
  counts,
  active,
  className,
}: {
  counts: DeckCounts;
  active?: keyof DeckCounts;
  className?: string;
}) {
  return (
    <ul className={cn("flex flex-wrap gap-2", className)} aria-label="Cartões de hoje">
      {chips.map((chip) => {
        const value = counts[chip.key];
        return (
          <li
            key={chip.key}
            className={cn(
              "flex items-baseline gap-1.5 rounded-pill border-2 px-3 py-1 text-sm font-semibold",
              value > 0 ? chip.on : "border-border bg-surface text-muted",
              active === chip.key && "ring-4 ring-foreground/15",
            )}
          >
            <span className="font-display text-base tabular-nums">{value}</span>
            {chip.label}
          </li>
        );
      })}
    </ul>
  );
}
