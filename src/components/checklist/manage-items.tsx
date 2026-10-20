"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ApiError, api } from "@/lib/api-client";
import type { ChecklistToday } from "@/lib/checklist-types";

const input =
  "h-11 min-w-0 flex-1 rounded-2xl border-2 border-border bg-surface px-4 hover:border-sky focus-visible:border-sky focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky/30";

/** Personalizar o checklist: ligar e desligar itens, criar os seus, renomear, apagar e reordenar. */
export function ManageItems({ data, onChange }: { data: ChecklistToday; onChange: (next: ChecklistToday) => void }) {
  const [label, setLabel] = useState("");
  const [editing, setEditing] = useState<{ key: string; label: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(request: () => Promise<ChecklistToday>) {
    setBusy(true);
    setError(null);
    try {
      onChange(await request());
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "Não deu para salvar agora. Tente de novo.");
    } finally {
      setBusy(false);
    }
  }

  const keys = data.items.map((item) => item.key);
  const move = (key: string, delta: -1 | 1) => {
    const index = keys.indexOf(key);
    const target = index + delta;
    if (target < 0 || target >= keys.length) return;
    const next = [...keys];
    [next[index], next[target]] = [next[target], next[index]];
    void run(() => api<ChecklistToday>("/checklist/items/order", { method: "PATCH", body: { keys: next } }));
  };

  async function add(event: React.FormEvent) {
    event.preventDefault();
    const text = label.trim();
    if (text.length < 2) return;
    await run(() => api<ChecklistToday>("/checklist/items", { method: "POST", body: { label: text } }));
    setLabel("");
  }

  return (
    <div className="flex flex-col gap-5">
      <ul className="flex flex-col gap-2">
        {data.items.map((item, index) => (
          <li key={item.key} className="flex flex-wrap items-center gap-2 rounded-2xl border-2 border-border bg-surface px-3 py-2">
            <label className="flex min-w-0 flex-1 items-center gap-3">
              <input
                type="checkbox"
                checked={item.enabled}
                disabled={busy}
                onChange={(event) => void run(() => api<ChecklistToday>(`/checklist/items/${item.key}`, { method: "PATCH", body: { enabled: event.target.checked } }))}
                className="size-5 shrink-0 accent-primary"
              />
              {editing?.key === item.key ? (
                <input
                  autoFocus
                  value={editing.label}
                  maxLength={60}
                  aria-label={`Novo nome de ${item.label}`}
                  onChange={(event) => setEditing({ key: item.key, label: event.target.value })}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void run(() => api<ChecklistToday>(`/checklist/items/${item.key}`, { method: "PATCH", body: { label: editing.label.trim() } })).then(() => setEditing(null));
                    }
                    if (event.key === "Escape") setEditing(null);
                  }}
                  className={input}
                />
              ) : (
                <span className={item.enabled ? "font-semibold" : "text-muted line-through"}>{item.label}</span>
              )}
            </label>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => move(item.key, -1)} disabled={busy || index === 0} aria-label={`Subir ${item.label}`} className="grid size-9 place-items-center rounded-full text-muted transition-colors hover:bg-surface-soft disabled:opacity-30">
                ↑
              </button>
              <button type="button" onClick={() => move(item.key, 1)} disabled={busy || index === keys.length - 1} aria-label={`Descer ${item.label}`} className="grid size-9 place-items-center rounded-full text-muted transition-colors hover:bg-surface-soft disabled:opacity-30">
                ↓
              </button>
              {item.kind === "CUSTOM" && (
                <>
                  <button type="button" onClick={() => setEditing({ key: item.key, label: item.label })} disabled={busy} className="rounded-pill px-3 py-1.5 text-sm font-bold text-muted transition-colors hover:bg-surface-soft hover:text-foreground">
                    Renomear
                  </button>
                  <button
                    type="button"
                    onClick={() => void run(() => api<ChecklistToday>(`/checklist/items/${item.key}`, { method: "DELETE" }))}
                    disabled={busy}
                    className="rounded-pill px-3 py-1.5 text-sm font-bold text-coral-edge transition-colors hover:bg-coral-soft"
                  >
                    Apagar
                  </button>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>

      <form onSubmit={add} className="flex flex-wrap gap-3">
        <label className="sr-only" htmlFor="new-item">
          Novo item do checklist
        </label>
        <input id="new-item" value={label} maxLength={60} onChange={(event) => setLabel(event.target.value)} placeholder="Ex.: Estudar vocabulário de tech" className={input} />
        <Button type="submit" variant="sky" disabled={busy || label.trim().length < 2}>
          Adicionar item
        </Button>
      </form>

      {error && (
        <p role="alert" className="font-semibold text-coral-edge">
          {error}
        </p>
      )}
      <p className="text-sm text-muted text-pretty">Itens desligados saem da conta do dia. Os itens do sistema só se desligam; os seus podem ser renomeados e apagados (até 10).</p>
    </div>
  );
}
