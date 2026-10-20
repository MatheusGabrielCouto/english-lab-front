"use client";

import Link from "next/link";
import { useState } from "react";
import { ManageItems } from "@/components/checklist/manage-items";
import { ProgressRing } from "@/components/checklist/progress-ring";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ApiError, api } from "@/lib/api-client";
import { dayMessage, formatLongDay, itemDetail } from "@/lib/checklist-format";
import type { ChecklistItem, ChecklistToday } from "@/lib/checklist-types";
import { cn } from "@/lib/cn";

const MINUTES = [10, 20, 30, 45, 60] as const;

/** O checklist de hoje: marca à mão, mostra o que a plataforma já marcou e deixa personalizar. */
export function ChecklistPanel({ initial }: { initial: ChecklistToday }) {
  const [data, setData] = useState(initial);
  const [asking, setAsking] = useState<string | null>(null);
  const [minutes, setMinutes] = useState<number>(20);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [managing, setManaging] = useState(false);

  const visible = data.items.filter((item) => item.enabled);
  const { summary, streak } = data;

  async function send(item: ChecklistItem, checked: boolean, withMinutes?: number) {
    setBusy(item.key);
    setError(null);
    try {
      setData(await api<ChecklistToday>(`/checklist/days/${data.day}/items/${item.key}`, { method: "PUT", body: { checked, minutes: withMinutes } }));
      setAsking(null);
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "Não deu para salvar agora. Tente de novo.");
    } finally {
      setBusy(null);
    }
  }

  function toggle(item: ChecklistItem) {
    // o que a plataforma marcou sozinha não se desmarca; o que você marcou, sim
    if (item.done && item.source === "auto") return;
    if (item.checked) return void send(item, false);
    if (item.askMinutes) {
      setAsking(item.key);
      setMinutes(item.defaultMinutes || 20);
      return;
    }
    void send(item, true);
  }

  return (
    <div className="mt-6 flex flex-col gap-6">
      <Card tone="primary" className="flex flex-wrap items-center gap-x-8 gap-y-4 p-6">
        <ProgressRing percent={summary.percent} label="Progresso de hoje">
          <span className="font-display text-3xl leading-none font-semibold tabular-nums">{summary.percent}%</span>
        </ProgressRing>
        <div className="min-w-0 flex-1 basis-56">
          <p className="text-sm font-bold text-muted">{formatLongDay(data.day)}</p>
          <p className="mt-1 font-display text-3xl font-semibold text-balance">
            {summary.done} de {summary.total} {summary.total === 1 ? "feito" : "feitos"}
          </p>
          <p className="mt-1 text-pretty" aria-live="polite">
            {dayMessage(summary.done, summary.total, summary.complete)}
          </p>
          <p className="mt-2 text-sm font-bold text-muted">
            🔥 {streak.current} {streak.current === 1 ? "dia completo seguido" : "dias completos seguidos"}
            {streak.longest > streak.current && ` · recorde ${streak.longest}`}
          </p>
        </div>
      </Card>

      {visible.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="text-pretty">Nenhum item ligado. Abra “Personalizar” para montar o seu dia.</p>
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {visible.map((item) => {
            const detail = itemDetail(item);
            const locked = item.done && item.source === "auto";
            return (
              <li key={item.key} className={cn("rounded-card border-2 bg-surface px-4 py-3 shadow-[0_4px_0_0_var(--color-border)] transition-colors", item.done ? "border-primary/50 bg-primary-soft" : "border-border")}>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={item.done}
                    aria-label={item.label}
                    aria-describedby={locked ? `${item.key}-auto` : undefined}
                    onClick={() => toggle(item)}
                    disabled={busy === item.key || locked}
                    className={cn(
                      "grid size-9 shrink-0 place-items-center rounded-full border-2 text-lg font-bold transition-colors",
                      item.done ? "border-primary-edge bg-primary text-on-primary" : "border-border bg-surface hover:border-sky",
                      locked && "cursor-default",
                    )}
                  >
                    {item.done ? "✓" : ""}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className={cn("font-display text-lg leading-snug font-semibold text-pretty", item.done && "text-muted line-through decoration-2")}>{item.label}</p>
                    {detail && (
                      <p id={locked ? `${item.key}-auto` : undefined} className="text-sm text-muted">
                        {item.source === "auto" ? "✔ Marcado automaticamente · " : ""}
                        {detail}
                      </p>
                    )}
                  </div>
                  {item.href && !item.done && (
                    <Link href={item.href} className="shrink-0 rounded-pill bg-surface-soft px-4 py-2 text-sm font-bold transition-colors hover:bg-sky">
                      Abrir
                    </Link>
                  )}
                </div>

                {asking === item.key && (
                  <div className="mt-3 flex flex-col gap-3 border-t-2 border-border pt-3">
                    <p className="font-semibold">Quantos minutos foram? (conta para a sua meta)</p>
                    <div className="flex flex-wrap gap-2" role="group" aria-label="Minutos">
                      {MINUTES.map((value) => (
                        <button
                          key={value}
                          type="button"
                          aria-pressed={minutes === value}
                          onClick={() => setMinutes(value)}
                          className={cn("rounded-pill border-2 px-4 py-1.5 text-sm font-bold transition-colors", minutes === value ? "border-foreground bg-foreground text-background" : "border-border bg-surface text-muted hover:border-sky hover:text-foreground")}
                        >
                          {value} min
                        </button>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={() => void send(item, true, minutes)} disabled={busy === item.key}>
                        Marcar como feito
                      </Button>
                      <Button variant="ghost" onClick={() => void send(item, true)} disabled={busy === item.key}>
                        Sem registrar o tempo
                      </Button>
                      <Button variant="ghost" onClick={() => setAsking(null)}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {error && (
        <p role="alert" className="font-semibold text-coral-edge">
          {error}
        </p>
      )}

      <div>
        <Button variant="ghost" onClick={() => setManaging((value) => !value)} aria-expanded={managing}>
          {managing ? "Fechar" : "Personalizar o checklist"}
        </Button>
        {managing && (
          <Card className="mt-4 p-5">
            <ManageItems data={data} onChange={setData} />
          </Card>
        )}
      </div>
    </div>
  );
}
