"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { ApiError, api } from "@/lib/api-client";
import { cn } from "@/lib/cn";
import { addDays, addMonths, DEADLINE_PRESETS, daysBetween, formatDay, formatMinutes, hoursBetween, TARGET_LEVELS } from "@/lib/goal-format";
import type { Goal, GoalOverview, GoalPreview } from "@/lib/goal-types";
import { LEVELS, type Level } from "@/lib/trail-types";

const MIN_DAYS = 7;

/** Criar ou editar a meta: nível, prazo e o objetivo em palavras, com a conta ao vivo. */
export function GoalForm({ overview, editing }: { overview: GoalOverview; editing: Goal | null }) {
  const router = useRouter();
  const { today, cumulativeHours } = overview;

  const [motivation, setMotivation] = useState(editing?.motivation ?? "");
  const [startLevel, setStartLevel] = useState<Level>(editing?.startLevel ?? overview.suggestedStartLevel);
  const [targetLevel, setTargetLevel] = useState<Level>(editing?.targetLevel ?? "B2");
  const [targetDay, setTargetDay] = useState(editing?.targetDay ?? addMonths(today, 12));
  const [preview, setPreview] = useState<GoalPreview | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const days = daysBetween(today, targetDay);
  const levelOk = LEVELS.findIndex((item) => item.level === targetLevel) >= LEVELS.findIndex((item) => item.level === startLevel);
  const dateProblem =
    days < MIN_DAYS ? `Escolha uma data pelo menos ${MIN_DAYS} dias à frente.` : days > 365 * 5 ? "Planeje no máximo 5 anos à frente." : null;
  const levelProblem = levelOk ? null : "O nível da meta não pode ser menor que o nível de partida.";
  const hours = useMemo(() => hoursBetween(cumulativeHours, startLevel, targetLevel), [cumulativeHours, startLevel, targetLevel]);

  // a prévia vem do servidor (mesma conta do plano), com uma pequena espera enquanto a pessoa digita
  useEffect(() => {
    if (dateProblem || levelProblem) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      api<GoalPreview>(`/goal/preview?targetLevel=${targetLevel}&startLevel=${startLevel}&targetDay=${targetDay}`)
        .then((result) => !controller.signal.aborted && setPreview(result))
        .catch(() => !controller.signal.aborted && setPreview(null));
    }, 250);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [targetLevel, startLevel, targetDay, dateProblem, levelProblem]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (dateProblem || levelProblem) return;
    setBusy(true);
    setError(null);
    try {
      await api("/goal", { method: "PUT", body: { targetLevel, startLevel, targetDay, motivation: motivation.trim() || undefined } });
      router.push("/meta");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "Não deu para salvar agora. Tente de novo.");
      setBusy(false);
    }
  }

  // enquanto o servidor não responde, mostra a mesma conta feita aqui (é uma divisão simples)
  const perDay = !dateProblem && !levelProblem ? (preview?.perDayMinutes ?? Math.ceil((hours * 60) / Math.max(1, days))) : undefined;

  return (
    <form onSubmit={submit} className="mt-8 flex flex-col gap-8">
      <Field
        id="motivation"
        label="Qual é o seu objetivo?"
        placeholder="Ex.: Dev backend em uma empresa no Canadá"
        maxLength={120}
        value={motivation}
        onChange={(event) => setMotivation(event.target.value)}
        hint="Opcional. Vai aparecer no topo da sua meta para lembrar por que você está estudando."
      />

      <fieldset>
        <legend className="font-display text-xl font-semibold">Que nível você quer alcançar?</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {TARGET_LEVELS.map((option) => {
            const selected = targetLevel === option.level;
            const needed = hoursBetween(cumulativeHours, startLevel, option.level);
            return (
              <label
                key={option.level}
                className={cn(
                  "relative flex cursor-pointer flex-col gap-1 rounded-2xl border-2 p-4 transition-colors has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-sky/30",
                  selected ? "border-primary bg-primary-soft" : "border-border bg-surface hover:border-sky",
                )}
              >
                <input type="radio" name="targetLevel" value={option.level} checked={selected} onChange={() => setTargetLevel(option.level)} className="sr-only" />
                <span className="flex flex-wrap items-center gap-2 font-display text-xl font-semibold">
                  {option.level} · {option.title}
                  {option.recommended && <span className="rounded-pill bg-butter px-2.5 py-0.5 text-xs font-bold text-ink">Recomendado</span>}
                </span>
                <span className="text-pretty text-muted">{option.text}</span>
                <span className="mt-1 text-sm font-bold">{needed > 0 ? `≈ ${needed} h de estudo` : "Já está abaixo do seu nível"}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="start-level" className="font-display text-base font-semibold">
            Seu nível hoje
          </label>
          <select
            id="start-level"
            value={startLevel}
            onChange={(event) => setStartLevel(event.target.value as Level)}
            className="h-12 rounded-2xl border-2 border-border bg-surface px-4 text-base hover:border-sky focus-visible:border-sky focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky/30"
          >
            {LEVELS.map((item) => (
              <option key={item.level} value={item.level}>
                {item.level} · {item.name}
              </option>
            ))}
          </select>
          <p className="text-sm text-muted">
            {startLevel === overview.suggestedStartLevel ? "Sugerido pelo seu teste de nível (ou A1, se ainda não fez)." : "Mudar aqui recalcula as horas."}
          </p>
        </div>
        <Field
          id="target-day"
          label="Até quando?"
          type="date"
          min={addDays(today, MIN_DAYS)}
          max={addDays(today, 365 * 5)}
          value={targetDay}
          onChange={(event) => setTargetDay(event.target.value)}
          error={dateProblem ?? levelProblem ?? undefined}
        />
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Prazos rápidos">
        {DEADLINE_PRESETS.map((preset) => {
          const day = addMonths(today, preset.months);
          return (
            <button
              key={preset.label}
              type="button"
              onClick={() => setTargetDay(day)}
              aria-pressed={targetDay === day}
              className={cn(
                "rounded-pill border-2 px-4 py-1.5 text-sm font-bold transition-colors",
                targetDay === day ? "border-foreground bg-foreground text-background" : "border-border bg-surface text-muted hover:border-sky hover:text-foreground",
              )}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      <Card tone="sky" aria-live="polite" className="p-6">
        <h2 className="font-display text-xl font-semibold">A conta</h2>
        {dateProblem || levelProblem ? (
          <p className="mt-2 text-pretty">{dateProblem ?? levelProblem}</p>
        ) : (
          <>
            <p className="mt-2 text-pretty">
              Do {startLevel} ao {targetLevel} são cerca de <strong>{hours} horas</strong> de estudo. Até {formatDay(targetDay)} ({days} dias), dá{" "}
              <strong>{formatMinutes(perDay ?? 0)} por dia</strong>
              {preview ? ` (${formatMinutes(preview.perWeekMinutes)} por semana)` : ""}.
            </p>
            {perDay !== undefined && perDay > 180 && (
              <p className="mt-2 text-pretty font-semibold">
                Isso é bastante por dia. Se ficar pesado, escolha uma data mais distante: constância ganha de maratona.
              </p>
            )}
          </>
        )}
        <p className="mt-3 text-sm text-muted text-pretty">
          São estimativas (a Cambridge fala em 500 a 600 horas para chegar ao B2 do zero). Lições, Anki, leitura e entrevistas contam como estudo, e você também pode
          registrar o que estudou fora da plataforma.
        </p>
      </Card>

      {error && (
        <p role="alert" className="font-semibold text-coral-edge">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" size="lg" disabled={busy || dateProblem !== null || levelProblem !== null}>
          {busy ? "Salvando…" : editing ? "Salvar meta" : "Começar minha meta"}
        </Button>
        {editing && (
          <ButtonLink href="/meta" variant="ghost" size="lg">
            Cancelar
          </ButtonLink>
        )}
      </div>
    </form>
  );
}
