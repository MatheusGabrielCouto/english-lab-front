import { DeleteGoal } from "@/components/goal/delete-goal";
import { LogStudy } from "@/components/goal/log-study";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDay, formatMinutes, formatShortDay, SOURCE_LABEL, statusInfo, statusMessage, todayMessage } from "@/lib/goal-format";
import type { Goal, GoalPlan } from "@/lib/goal-types";
import { cn } from "@/lib/cn";

/** A barra grande: o quanto você já estudou, com um marcador de onde deveria estar pelo prazo. */
export function GoalBar({ percent, timePercent, className }: { percent: number; timePercent: number; className?: string }) {
  return (
    <div className={cn("relative pt-6", className)}>
      <div
        role="progressbar"
        aria-label="Progresso da meta"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="h-5 w-full overflow-hidden rounded-pill bg-surface-soft"
      >
        <div className="h-full rounded-pill bg-primary transition-[width] duration-500 ease-out" style={{ width: `${percent}%` }} />
      </div>
      <div className="absolute top-0 -translate-x-1/2 text-center text-xs font-bold text-muted" style={{ left: `${Math.min(97, Math.max(3, timePercent))}%` }}>
        <span className="block whitespace-nowrap">prazo {timePercent}%</span>
        <span aria-hidden className="mx-auto block h-3 w-0.5 bg-foreground/50" />
      </div>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl bg-surface-soft px-4 py-3">
      <dt className="text-sm font-bold text-muted">{label}</dt>
      <dd className="mt-1 font-display text-2xl font-semibold tabular-nums">{value}</dd>
      {hint && <p className="text-sm text-muted">{hint}</p>}
    </div>
  );
}

/** Minutos por dia nos últimos 14 dias, com a meta diária como linha de referência. */
function RecentChart({ plan }: { plan: GoalPlan }) {
  const max = Math.max(plan.dailyTargetMinutes, ...plan.recent.map((entry) => entry.minutes), 1);
  return (
    <div>
      <div className="relative flex h-40 items-end gap-1.5 sm:gap-2" role="img" aria-label="Minutos estudados nos últimos 14 dias">
        {plan.dailyTargetMinutes > 0 && (
          <div className="pointer-events-none absolute inset-x-0 border-t-2 border-dashed border-foreground/40" style={{ bottom: `${(plan.dailyTargetMinutes / max) * 100}%` }}>
            <span className="absolute -top-6 right-0 text-xs font-bold text-muted">meta {formatMinutes(plan.dailyTargetMinutes)}</span>
          </div>
        )}
        {plan.recent.map((entry, index) => {
          const isToday = index === plan.recent.length - 1;
          const reached = plan.dailyTargetMinutes > 0 && entry.minutes >= plan.dailyTargetMinutes;
          return (
            <div key={entry.day} className="flex h-full flex-1 flex-col justify-end" title={`${formatShortDay(entry.day)}: ${formatMinutes(entry.minutes)}`}>
              <div
                className={cn("w-full rounded-t-md", reached ? "bg-primary" : "bg-sky", isToday && "ring-2 ring-foreground/40")}
                style={{ height: `${Math.max(entry.minutes > 0 ? 4 : 0, (entry.minutes / max) * 100)}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-1 flex justify-between text-xs font-bold text-muted" aria-hidden>
        <span>{formatShortDay(plan.recent[0].day)}</span>
        <span>hoje</span>
      </div>
      <details className="mt-3 text-sm">
        <summary className="w-fit cursor-pointer font-bold text-muted hover:text-foreground">Ver como tabela</summary>
        <table className="mt-2 w-full text-left">
          <thead>
            <tr className="text-muted">
              <th scope="col" className="py-1 pr-4 font-semibold">Dia</th>
              <th scope="col" className="py-1 font-semibold">Estudo</th>
            </tr>
          </thead>
          <tbody>
            {plan.recent.map((entry) => (
              <tr key={entry.day} className="border-t border-border">
                <td className="py-1 pr-4">{formatShortDay(entry.day)}</td>
                <td className="py-1 tabular-nums">{formatMinutes(entry.minutes)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}

export function GoalDashboard({ goal, plan, today }: { goal: Goal; plan: GoalPlan; today: string }) {
  const status = statusInfo(plan.status);
  const todayPercent = plan.dailyTargetMinutes === 0 ? 100 : Math.min(100, Math.round((plan.todayMinutes / plan.dailyTargetMinutes) * 100));
  const sources = (Object.keys(SOURCE_LABEL) as (keyof typeof SOURCE_LABEL)[]).map((key) => ({ key, minutes: plan.bySource[key] }));
  const total = sources.reduce((sum, item) => sum + item.minutes, 0);

  return (
    <div className="mt-6 flex flex-col gap-6">
      <Card tone="primary" className="p-6 md:p-8">
        <p className="text-sm font-bold text-muted">🌎 Rumo a trabalhar no exterior</p>
        <h2 className="mt-1 font-display text-3xl leading-tight font-semibold text-balance md:text-4xl">{goal.motivation || "Minha meta de inglês"}</h2>
        <p className="mt-1 text-lg text-muted">
          {goal.startLevel} → <strong className="text-foreground">{goal.targetLevel}</strong> até {formatDay(goal.targetDay)}
        </p>

        <div className="mt-6 flex flex-wrap items-end gap-x-4 gap-y-1">
          <p className="font-display text-6xl leading-none font-semibold tabular-nums md:text-7xl">{plan.percent}%</p>
          <p className="pb-1 text-lg font-semibold text-pretty">{plan.percent >= 100 ? "do caminho: chegou lá!" : "do caminho percorrido"}</p>
        </div>
        <GoalBar percent={plan.percent} timePercent={plan.timePercent} className="mt-2" />
        <p className="mt-2 text-sm text-muted">
          {formatMinutes(plan.studiedMinutes)} estudados de {plan.requiredHours} h previstas
        </p>
      </Card>

      <Card tone={status.tone} className="p-6">
        <h2 className="font-display text-2xl font-semibold">
          <span aria-hidden>{status.icon}</span> {status.title}
        </h2>
        <p className="mt-2 text-pretty">{statusMessage(plan)}</p>
        {(plan.status === "ahead" || plan.status === "overdue") && plan.projectedDay && plan.recentAverage > 0 && (
          <p className="mt-2 text-sm text-muted">No seu ritmo atual, você chega em {formatDay(plan.projectedDay)}.</p>
        )}
      </Card>

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Faltam" value={plan.daysLeft === 1 ? "1 dia" : `${plan.daysLeft} dias`} hint={`de ${plan.daysTotal}`} />
        <Stat label="Falta estudar" value={formatMinutes(plan.minutesLeft)} />
        <Stat label="Por dia" value={formatMinutes(plan.dailyTargetMinutes)} hint="para chegar no prazo" />
        <Stat label="Por semana" value={formatMinutes(plan.weeklyTargetMinutes)} />
      </dl>

      <Card className="p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-2xl font-semibold">Hoje</h2>
          <p className="font-bold tabular-nums">
            {formatMinutes(plan.todayMinutes)} <span className="font-medium text-muted">de {formatMinutes(plan.dailyTargetMinutes)}</span>
          </p>
        </div>
        <div role="progressbar" aria-label="Meta de hoje" aria-valuemin={0} aria-valuemax={100} aria-valuenow={todayPercent} className="mt-3 h-4 w-full overflow-hidden rounded-pill bg-surface-soft">
          <div className="h-full rounded-pill bg-butter transition-[width] duration-500 ease-out" style={{ width: `${todayPercent}%` }} />
        </div>
        <p className="mt-3 text-pretty">{todayMessage(plan)}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <ButtonLink href="/trilha">Fazer uma lição</ButtonLink>
          <ButtonLink href="/anki" variant="sky">
            Revisar no Anki
          </ButtonLink>
          <ButtonLink href="/entrevista" variant="ghost">
            Treinar entrevista
          </ButtonLink>
        </div>
        <p className="mt-4 text-sm text-muted">
          🔥 {plan.studyStreak} {plan.studyStreak === 1 ? "dia seguido" : "dias seguidos"} estudando · {plan.activeDays}{" "}
          {plan.activeDays === 1 ? "dia" : "dias"} de estudo desde que você começou
        </p>
      </Card>

      <Card className="p-6">
        <h2 className="font-display text-2xl font-semibold">Últimos 14 dias</h2>
        <p className="mt-1 mb-8 text-muted">Barras verdes: dias em que você bateu a meta diária.</p>
        <RecentChart plan={plan} />
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <h2 className="font-display text-2xl font-semibold">De onde vem o seu estudo</h2>
          <ul className="mt-4 flex flex-col gap-3">
            {sources.map((item) => (
              <li key={item.key}>
                <div className="flex justify-between gap-3 font-semibold">
                  <span>{SOURCE_LABEL[item.key]}</span>
                  <span className="tabular-nums text-muted">{formatMinutes(item.minutes)}</span>
                </div>
                <div className="mt-1 h-2.5 overflow-hidden rounded-pill bg-surface-soft">
                  <div className="h-full rounded-pill bg-sky" style={{ width: `${total === 0 ? 0 : (item.minutes / total) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card tone="butter" className="p-6">
          <h2 className="font-display text-2xl font-semibold">Estudou fora da plataforma?</h2>
          <p className="mt-1 mb-4 text-pretty">Aula, podcast, vídeo, conversa: registre aqui e conta para a meta.</p>
          <LogStudy today={today} />
        </Card>
      </div>

      <details className="rounded-card border-2 border-border bg-surface px-6 py-4">
        <summary className="cursor-pointer font-display text-lg font-semibold">Como a conta é feita</summary>
        <div className="mt-3 flex flex-col gap-2 text-pretty text-muted">
          <p>
            Usamos as horas de estudo que a Cambridge costuma citar para cada nível: cerca de 90 h para o A1, 200 h até o A2, 375 h até o B1, 550 h até o B2, 750 h até o
            C1 e 1050 h até o C2. O plano soma as faixas do seu nível de hoje até o da meta.
          </p>
          <p>
            Contam como estudo o tempo nas lições (do primeiro exercício ao fim), as revisões do Anki, a leitura (estimada pelas viradas de página) e as entrevistas.
            Cada pessoa avança em um ritmo: trate os números como um mapa, não como uma nota.
          </p>
        </div>
      </details>

      <div className="flex flex-wrap items-center gap-3">
        <ButtonLink href="/meta?editar=1" variant="ghost">
          Editar meta
        </ButtonLink>
        <DeleteGoal />
      </div>
    </div>
  );
}
