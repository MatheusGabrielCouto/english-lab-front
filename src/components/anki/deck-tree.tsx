import { CountChips } from "@/components/anki/count-chips";
import { toneAt } from "@/components/anki/deck-tones";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { Deck } from "@/lib/anki-types";

const dueOf = (deck: Deck) =>
  deck.counts.new + deck.counts.learning + deck.counts.review;

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}

function Actions({ deck, compact }: { deck: Deck; compact?: boolean }) {
  const due = dueOf(deck);
  return (
    <div className="flex shrink-0 items-center gap-2">
      <ButtonLink href={`/anki/baralho/${deck.id}`} variant="ghost" className={compact ? "h-9 px-4 text-sm" : undefined}>
        Gerenciar
      </ButtonLink>
      {due > 0 ? (
        <ButtonLink href={`/anki/estudar/${deck.id}`} className={compact ? "h-9 px-4 text-sm" : undefined}>
          Estudar
        </ButtonLink>
      ) : (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-pill bg-primary-soft font-display font-semibold text-primary",
            compact ? "h-9 px-3 text-sm" : "h-11 px-4",
          )}
        >
          <span aria-hidden>✓</span> Em dia
        </span>
      )}
    </div>
  );
}

function ChildNode({ deck, byParent }: { deck: Deck; byParent: Map<string, Deck[]> }) {
  const children = byParent.get(deck.id) ?? [];
  return (
    <li>
      <div className="flex flex-col gap-3 rounded-2xl px-3 py-3 transition-colors hover:bg-surface-soft sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h3 className="truncate font-display text-lg font-semibold">{deck.name}</h3>
          <p className="text-sm text-muted">{plural(deck.totalCards, "cartão", "cartões")}</p>
          <CountChips counts={deck.counts} className="mt-2" />
        </div>
        <Actions deck={deck} compact />
      </div>
      {children.length > 0 && (
        <ul className="ml-5 border-l-2 border-border pl-3">
          {children.map((child) => (
            <ChildNode key={child.id} deck={child} byParent={byParent} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function DeckTree({ decks }: { decks: Deck[] }) {
  const byParent = new Map<string, Deck[]>();
  const roots: Deck[] = [];
  for (const deck of decks) {
    if (deck.parentId) {
      byParent.set(deck.parentId, [...(byParent.get(deck.parentId) ?? []), deck]);
    } else {
      roots.push(deck);
    }
  }

  return (
    <ul className="flex flex-col gap-5">
      {roots.map((deck, index) => {
        const tone = toneAt(index);
        const children = byParent.get(deck.id) ?? [];
        return (
          <li
            key={deck.id}
            className={cn(
              "rounded-card border-2 bg-surface p-5 shadow-[0_4px_0_0_var(--color-border)]",
              tone.ring,
            )}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                <span
                  aria-hidden
                  className={cn(
                    "grid size-14 shrink-0 place-items-center rounded-2xl font-display text-2xl font-semibold",
                    tone.tile,
                  )}
                >
                  {deck.name.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <h3 className="truncate font-display text-2xl font-semibold">{deck.name}</h3>
                  <p className="text-sm text-muted">
                    {plural(deck.totalCards, "cartão", "cartões")}
                    {children.length > 0 && ` · ${plural(children.length, "subbaralho", "subbaralhos")}`}
                  </p>
                </div>
              </div>
              <Actions deck={deck} />
            </div>

            <CountChips counts={deck.counts} className="mt-4" />

            {children.length > 0 && (
              <details open className="group mt-4 border-t-2 border-border pt-3">
                <summary className="flex w-fit cursor-pointer list-none items-center gap-2 rounded-pill px-3 py-1 text-sm font-bold text-muted transition-colors hover:bg-surface-soft hover:text-foreground [&::-webkit-details-marker]:hidden">
                  <span aria-hidden className="transition-transform duration-200 group-open:rotate-90">
                    ▸
                  </span>
                  Subbaralhos
                </summary>
                <ul className="mt-2">
                  {children.map((child) => (
                    <ChildNode key={child.id} deck={child} byParent={byParent} />
                  ))}
                </ul>
              </details>
            )}
          </li>
        );
      })}
    </ul>
  );
}
