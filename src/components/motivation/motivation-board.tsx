"use client";

import { useState } from "react";
import { AddItem } from "@/components/motivation/add-item";
import { ItemBody } from "@/components/motivation/item-body";
import { ItemCard } from "@/components/motivation/item-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { countsByFilter, type Filter, FILTERS, matchesFilter, pickAnother } from "@/lib/motivation-format";
import type { MotivationItem } from "@/lib/motivation-types";

/** O mural de motivação: "Me motive agora", adicionar itens, filtros e a grade de itens. */
export function MotivationBoard({ initialItems, initialSpotlight, mediaEnabled }: { initialItems: MotivationItem[]; initialSpotlight: MotivationItem | null; mediaEnabled: boolean }) {
  const [items, setItems] = useState(initialItems);
  const [spotlightId, setSpotlightId] = useState<string | null>(initialSpotlight?.id ?? null);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [adding, setAdding] = useState(initialItems.length === 0);

  const spotlight = items.find((item) => item.id === spotlightId) ?? null;
  const counts = countsByFilter(items);
  const visible = items.filter((item) => matchesFilter(item, filter));

  const replace = (next: MotivationItem) => setItems((current) => current.map((item) => (item.id === next.id ? next : item)));
  const remove = (id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
    setSpotlightId((current) => (current === id ? null : current));
  };
  const add = (item: MotivationItem) => {
    setItems((current) => [item, ...current]);
    setSpotlightId((current) => current ?? item.id);
  };

  return (
    <div className="mt-6 flex flex-col gap-8">
      {spotlight ? (
        <Card tone="lavender" className="p-6 md:p-8">
          <p className="text-sm font-bold text-muted">💪 Me motive agora</p>
          <div className="mt-4" aria-live="polite">
            <ItemBody item={spotlight} large />
          </div>
          {items.length > 1 && (
            <div className="mt-6">
              <Button variant="ghost" onClick={() => setSpotlightId(pickAnother(items, spotlight.id)?.id ?? null)}>
                Outro 🎲
              </Button>
            </div>
          )}
        </Card>
      ) : items.length > 0 ? (
        <Card tone="lavender" className="flex flex-wrap items-center justify-between gap-4 p-6">
          <p className="font-display text-2xl font-semibold">Precisa de um empurrão?</p>
          <Button onClick={() => setSpotlightId(pickAnother(items, null)?.id ?? null)}>Me motive agora 💪</Button>
        </Card>
      ) : (
        <Card tone="lavender" className="p-6 md:p-8">
          <h2 className="font-display text-2xl font-semibold text-balance">Seu mural está vazio</h2>
          <p className="mt-2 max-w-2xl text-pretty">
            Guarde aqui o que te faz continuar: uma frase sua, uma foto do lugar onde quer morar, um vídeo que te arrepia, ou um áudio com a sua própria voz para ouvir nos dias difíceis.
          </p>
        </Card>
      )}

      <section aria-labelledby="add-title">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="add-title" className="font-display text-2xl font-semibold">
            Adicionar ao mural
          </h2>
          <Button variant="ghost" onClick={() => setAdding((value) => !value)} aria-expanded={adding}>
            {adding ? "Fechar" : "Adicionar"}
          </Button>
        </div>
        {adding && (
          <div className="mt-4">
            <AddItem mediaEnabled={mediaEnabled} onAdded={add} />
          </div>
        )}
      </section>

      {items.length > 0 && (
        <section aria-labelledby="board-title">
          <h2 id="board-title" className="font-display text-2xl font-semibold">
            Seu mural <span className="text-muted">({items.length})</span>
          </h2>
          <div role="group" aria-label="Filtrar o mural" className="mt-3 flex flex-wrap gap-2">
            {FILTERS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                aria-pressed={filter === value}
                onClick={() => setFilter(value)}
                disabled={counts[value] === 0 && value !== "ALL"}
                className={cn(
                  "rounded-pill border-2 px-4 py-1.5 text-sm font-bold transition-colors disabled:opacity-40",
                  filter === value ? "border-foreground bg-foreground text-background" : "border-border bg-surface text-muted hover:border-sky hover:text-foreground",
                )}
              >
                {label} <span className="tabular-nums opacity-70">{counts[value]}</span>
              </button>
            ))}
          </div>
          <ul className="mt-5 gap-5 [column-fill:_balance] sm:columns-2 lg:columns-3">
            {visible.map((item) => (
              <li key={item.id} className="mb-5 break-inside-avoid">
                <ItemCard item={item} onChange={replace} onRemove={remove} />
              </li>
            ))}
          </ul>
          {visible.length === 0 && <p className="mt-5 rounded-2xl bg-surface-soft px-4 py-3 text-muted">Nada neste filtro ainda.</p>}
        </section>
      )}
    </div>
  );
}
