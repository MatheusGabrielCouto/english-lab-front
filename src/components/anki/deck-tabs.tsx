"use client";

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export type DeckTab = {
  id: string;
  label: string;
  badge?: number;
  panel: ReactNode;
};

/**
 * Abas acessíveis (setas, Home/End). Todos os painéis ficam montados, só
 * escondidos, para não perder o que foi digitado ao trocar de aba.
 */
export function DeckTabs({ tabs }: { tabs: DeckTab[] }) {
  const [active, setActive] = useState(tabs[0].id);
  const base = useId();
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  function onKeyDown(event: KeyboardEvent, index: number) {
    const last = tabs.length - 1;
    const target =
      event.key === "ArrowRight" ? (index + 1) % tabs.length
      : event.key === "ArrowLeft" ? (index - 1 + tabs.length) % tabs.length
      : event.key === "Home" ? 0
      : event.key === "End" ? last
      : null;
    if (target === null) return;
    event.preventDefault();
    setActive(tabs[target].id);
    refs.current[tabs[target].id]?.focus();
  }

  return (
    <div>
      <div
        role="tablist"
        aria-label="Seções do baralho"
        className="flex gap-1 overflow-x-auto border-b-2 border-border"
      >
        {tabs.map((tab, index) => {
          const selected = tab.id === active;
          return (
            <button
              key={tab.id}
              ref={(el) => {
                refs.current[tab.id] = el;
              }}
              id={`${base}-tab-${tab.id}`}
              role="tab"
              type="button"
              aria-selected={selected}
              aria-controls={`${base}-panel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(tab.id)}
              onKeyDown={(event) => onKeyDown(event, index)}
              className={cn(
                "relative flex shrink-0 items-center gap-2 rounded-t-2xl px-5 py-3 font-display text-lg font-semibold transition-colors",
                selected
                  ? "text-foreground"
                  : "text-muted hover:bg-surface-soft hover:text-foreground",
              )}
            >
              {tab.label}
              {/* indicador da aba ativa: traço próprio, sem depender da borda arredondada */}
              <span
                aria-hidden
                className={cn(
                  "absolute inset-x-3 bottom-0 h-1 rounded-pill bg-primary transition-opacity duration-150",
                  selected ? "opacity-100" : "opacity-0",
                )}
              />
              {tab.badge !== undefined && (
                <span
                  className={cn(
                    "rounded-pill px-2 py-0.5 text-xs font-bold tabular-nums",
                    selected ? "bg-primary-soft text-primary" : "bg-surface-soft text-muted",
                  )}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {tabs.map((tab) => (
        <div
          key={tab.id}
          id={`${base}-panel-${tab.id}`}
          role="tabpanel"
          aria-labelledby={`${base}-tab-${tab.id}`}
          hidden={tab.id !== active}
          className="pt-8"
        >
          {tab.panel}
        </div>
      ))}
    </div>
  );
}
