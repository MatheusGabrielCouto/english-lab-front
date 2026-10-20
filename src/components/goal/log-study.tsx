"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ApiError, api } from "@/lib/api-client";
import { cn } from "@/lib/cn";
import { addDays } from "@/lib/goal-format";

const QUICK = [15, 30, 60, 90] as const;

/** Registrar estudo feito fora da plataforma (aula, podcast, conversa, vídeo…). */
export function LogStudy({ today }: { today: string }) {
  const router = useRouter();
  const [minutes, setMinutes] = useState<number>(30);
  const [yesterday, setYesterday] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      await api("/goal/log", { method: "POST", body: { minutes, day: yesterday ? addDays(today, -1) : undefined } });
      setMessage({ kind: "ok", text: `${minutes} min registrados.` });
      router.refresh();
    } catch (reason) {
      setMessage({ kind: "error", text: reason instanceof ApiError ? reason.message : "Não deu para registrar agora." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Minutos estudados">
        {QUICK.map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={minutes === value}
            onClick={() => setMinutes(value)}
            className={cn(
              "rounded-pill border-2 px-4 py-1.5 text-sm font-bold transition-colors",
              minutes === value ? "border-foreground bg-foreground text-background" : "border-border bg-surface text-muted hover:border-sky hover:text-foreground",
            )}
          >
            {value} min
          </button>
        ))}
        <label className="flex items-center gap-2 text-sm font-semibold">
          <span className="sr-only">Outro valor, em minutos</span>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={600}
            value={minutes}
            onChange={(event) => setMinutes(Math.min(600, Math.max(0, Math.round(Number(event.target.value) || 0))))}
            className="h-9 w-20 rounded-xl border-2 border-border bg-surface px-2 text-center tabular-nums hover:border-sky focus-visible:border-sky focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky/30"
          />
          min
        </label>
      </div>
      <label className="flex items-center gap-2 font-semibold">
        <input type="checkbox" checked={yesterday} onChange={(event) => setYesterday(event.target.checked)} className="size-5 accent-primary" />
        Foi ontem
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="sky" disabled={busy || minutes < 1}>
          {busy ? "Registrando…" : "Registrar estudo"}
        </Button>
        {message && (
          <p role={message.kind === "error" ? "alert" : "status"} className={cn("font-semibold", message.kind === "error" ? "text-coral-edge" : "text-primary")}>
            {message.text}
          </p>
        )}
      </div>
    </form>
  );
}
