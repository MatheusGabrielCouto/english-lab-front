"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

export type StackedItem = {
  key: string;
  label: string;
  value: number;
  /** classe de fundo da cor da categoria, ex.: "bg-viz-1" */
  swatch: string;
  /** explicação curta, mostrada na legenda */
  hint?: string;
};

/**
 * Barra empilhada de parte-do-todo: segmentos separados por 2px de superfície,
 * pontas arredondadas, e a legenda com os números (a leitura nunca depende só da cor).
 */
export function StackedBar({ items, label }: { items: StackedItem[]; label: string }) {
  const [active, setActive] = useState<string | null>(null);
  const total = items.reduce((sum, item) => sum + item.value, 0);
  const visible = items.filter((item) => item.value > 0);
  const percent = (value: number) => (total ? Math.round((value / total) * 100) : 0);
  const format = (n: number) => n.toLocaleString("pt-BR");

  if (total === 0) {
    return <p className="rounded-2xl border-2 border-dashed border-border px-4 py-6 text-center text-muted">Nenhum cartão ainda.</p>;
  }

  return (
    <div>
      <div
        role="img"
        aria-label={`${label}: ${items.map((item) => `${item.label} ${item.value}`).join(", ")}`}
        className="flex h-6 gap-0.5"
      >
        {visible.map((item, index) => (
          <div
            key={item.key}
            onPointerEnter={() => setActive(item.key)}
            onPointerLeave={() => setActive(null)}
            className={cn(
              "min-w-1 transition-[filter] duration-100",
              item.swatch,
              index === 0 && "rounded-l",
              index === visible.length - 1 && "rounded-r",
              active === item.key && "brightness-110",
            )}
            style={{ flexGrow: item.value, flexBasis: 0 }}
          />
        ))}
      </div>

      <ul className="mt-4 grid gap-x-6 gap-y-2 sm:grid-cols-2">
        {items.map((item) => (
          <li
            key={item.key}
            onPointerEnter={() => setActive(item.key)}
            onPointerLeave={() => setActive(null)}
            className={cn(
              "flex items-start gap-3 rounded-xl px-2 py-1.5 transition-colors",
              active === item.key && "bg-surface-soft",
            )}
          >
            <span aria-hidden className={cn("mt-1.5 size-3 shrink-0 rounded-sm", item.swatch)} />
            <div className="min-w-0 flex-1">
              <p className="flex items-baseline justify-between gap-3">
                <span className="font-semibold">{item.label}</span>
                <span className="tabular-nums">
                  <span className="font-display text-lg font-semibold">{format(item.value)}</span>
                  <span className="ml-1.5 text-sm text-muted">{percent(item.value)}%</span>
                </span>
              </p>
              {item.hint && <p className="text-xs text-muted">{item.hint}</p>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
