"use client";

import { useCallback, useState, type ReactNode } from "react";
import { ActivityCalendar } from "@/components/charts/activity-calendar";
import { BarList } from "@/components/charts/bar-list";
import { ColumnChart, type ColumnDatum } from "@/components/charts/column-chart";
import { StackedBar } from "@/components/charts/stacked-bar";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api, ApiError } from "@/lib/api-client";
import type { Stats } from "@/lib/anki-types";
import { cn } from "@/lib/cn";
import {
  answerRows,
  answerTip,
  busiestForecastDay,
  dayPart,
  daysLabel,
  daysToFinishNew,
  hourRange,
  peakIndex,
  percentOf,
  retentionLevel,
  WEEKDAYS,
  type Tone,
} from "@/lib/stats-insights";

const PERIODS = [
  { days: 7, label: "7 dias" },
  { days: 30, label: "30 dias" },
  { days: 90, label: "90 dias" },
  { days: 365, label: "1 ano" },
];

/** "2026-10-16" → "16/10" (sem passar por Date, para não depender do fuso) */
function shortDate(key: string) {
  const [, month, day] = key.split("-");
  return `${day}/${month}`;
}

function longDate(key: string) {
  return new Date(`${key}T00:00:00Z`).toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  });
}

/** "2026-11-03" → "terça-feira, 3 de novembro" (para frases, não para eixos de gráfico) */
function sentenceDate(key: string) {
  return new Date(`${key}T00:00:00Z`).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

function minutesLabel(minutes: number) {
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = Math.floor(minutes / 60);
  const rest = Math.round(minutes % 60);
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}

const TONE: Record<Tone, string> = {
  good: "bg-primary-soft text-primary",
  ok: "bg-sky-soft text-sky-edge",
  warn: "bg-coral-soft text-coral-edge",
  neutral: "bg-surface-soft text-muted",
};

function Tile({
  label,
  value,
  hint,
  badge,
}: {
  label: string;
  value: ReactNode;
  hint: string;
  badge?: { text: string; tone: Tone };
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-muted">{label}</p>
        {badge && <span className={cn("rounded-pill px-2.5 py-0.5 text-xs font-bold", TONE[badge.tone])}>{badge.text}</span>}
      </div>
      <p className="mt-1 font-display text-4xl font-semibold leading-none">{value}</p>
      <p className="mt-2 text-sm text-muted text-pretty">{hint}</p>
    </Card>
  );
}

function Section({
  title,
  subtitle,
  children,
  tip,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  /** explicação do que o quadro mostra, em uma frase simples */
  tip?: string;
}) {
  return (
    <section className="rounded-card border-2 border-border bg-surface p-6 shadow-[0_4px_0_0_var(--color-border)]">
      <h2 className="font-display text-2xl font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-muted text-pretty">{subtitle}</p>
      {tip && <p className="mt-2 rounded-xl bg-surface-soft px-3 py-2 text-sm text-pretty">{tip}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

const CONTROL =
  "h-11 rounded-2xl border-2 border-border bg-surface px-3 text-base hover:border-sky focus-visible:border-sky focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky/30";

export function StatsDashboard({
  decks,
  initial,
}: {
  decks: { id: string; fullName: string }[];
  initial: Stats;
}) {
  const [stats, setStats] = useState(initial);
  const [deckId, setDeckId] = useState("");
  const [days, setDays] = useState(initial.days);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  const load = useCallback(async (nextDeck: string, nextDays: number) => {
    setLoading(true);
    setError(undefined);
    try {
      const params = new URLSearchParams({ days: String(nextDays) });
      if (nextDeck) params.set("deckId", nextDeck);
      setStats(await api<Stats>(`/anki/stats?${params}`));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Não consegui carregar as estatísticas.");
    } finally {
      setLoading(false);
    }
  }, []);

  const history: ColumnDatum[] = stats.history.map((day) => ({
    key: day.date,
    tick: shortDate(day.date),
    title: longDate(day.date),
    value: day.reviews,
    detail: day.reviews
      ? `${day.correct} ${day.correct === 1 ? "acerto" : "acertos"} (${Math.round((day.correct / day.reviews) * 100)}%) · ${minutesLabel(day.minutes)}`
      : undefined,
  }));

  const forecast: ColumnDatum[] = stats.forecast.map((day, index) => ({
    key: day.date,
    tick: index === 0 ? "hoje" : shortDate(day.date),
    title: index === 0 ? `${longDate(day.date)} (hoje)` : longDate(day.date),
    value: day.due,
  }));

  const periodReviews = stats.history.reduce((sum, day) => sum + day.reviews, 0);
  const periodCorrect = stats.history.reduce((sum, day) => sum + day.correct, 0);
  const periodRate = periodReviews ? percentOf(periodCorrect, periodReviews) : null;
  const todayRate = stats.today.reviews ? percentOf(stats.today.correct, stats.today.reviews) : null;
  const forecastTotal = stats.forecast.reduce((sum, day) => sum + day.due, 0);
  const busiest = busiestForecastDay(stats.forecast);
  const retention = retentionLevel(stats.retention.rate);

  const pendingTotal = stats.pending.new + stats.pending.learning + stats.pending.review;
  const studyHref = deckId ? `/anki/estudar/${deckId}` : "/anki";
  const hasStudied = stats.allTime.reviews > 0;

  const weekdayPeak = peakIndex(stats.byWeekday);
  const hourPeak = peakIndex(stats.byHour);
  const answers = answerRows(stats.answers);
  const answerAdvice = answerTip(stats.answers);

  const phaseTotal = stats.cards.total - stats.cards.suspended;
  const fixedPercent = percentOf(stats.cards.mature, phaseTotal);
  const seenPercent = percentOf(phaseTotal - stats.cards.new, phaseTotal);
  const daysLeft = daysToFinishNew(stats.cards.new, stats.pace.newPerDay);

  const hours: ColumnDatum[] = stats.byHour.map((value, hour) => ({
    key: String(hour),
    tick: `${hour}h`,
    title: hourRange(hour),
    value,
  }));

  return (
    <div>
      {/* Filtros: uma linha acima de tudo que eles controlam */}
      <section aria-label="Filtros" className="flex flex-wrap items-end gap-4">
        <label className="flex min-w-48 flex-col gap-1 text-sm font-semibold">
          Baralho
          <select
            value={deckId}
            onChange={(e) => {
              setDeckId(e.target.value);
              void load(e.target.value, days);
            }}
            className={CONTROL}
          >
            <option value="">Todos os baralhos</option>
            {decks.map((deck) => (
              <option key={deck.id} value={deck.id}>
                {deck.fullName.split("::").join(" › ")}
              </option>
            ))}
          </select>
        </label>

        <div role="group" aria-label="Período" className="flex flex-wrap gap-2">
          {PERIODS.map((period) => (
            <button
              key={period.days}
              type="button"
              aria-pressed={days === period.days}
              onClick={() => {
                setDays(period.days);
                void load(deckId, period.days);
              }}
              className={cn(
                "h-11 rounded-pill border-2 px-4 text-sm font-bold transition-colors",
                days === period.days
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-surface text-muted hover:border-sky hover:text-foreground",
              )}
            >
              {period.label}
            </button>
          ))}
        </div>
      </section>

      <p role="alert" className="mt-3 min-h-5 text-sm font-semibold text-coral-edge">
        {error}
      </p>

      {/* Durante o recarregamento o quadro continua na tela, só mais claro */}
      <div className={cn("mt-2 flex flex-col gap-6 transition-opacity duration-150", loading && "opacity-50")} aria-busy={loading}>
        {/* Resumo: a resposta para "como estou hoje?" em linguagem simples */}
        <section className="rounded-card border-2 border-border bg-surface p-6 shadow-[0_4px_0_0_var(--color-border)] md:p-8">
          <p className="text-sm font-bold uppercase tracking-wide text-muted">Resumo de hoje</p>
          <h2 className="mt-1 font-display text-3xl font-semibold text-balance md:text-4xl">
            {!hasStudied
              ? "Você ainda não começou a estudar."
              : stats.today.reviews === 0
                ? "Hoje você ainda não estudou."
                : pendingTotal === 0
                  ? "Meta de hoje cumprida! 🎉"
                  : `Você já respondeu ${stats.today.reviews} ${stats.today.reviews === 1 ? "cartão" : "cartões"} hoje.`}
          </h2>
          <p className="mt-2 max-w-2xl text-lg text-muted text-pretty">
            {pendingTotal > 0
              ? `Ainda ${pendingTotal === 1 ? "falta" : "faltam"} ${pendingTotal} ${pendingTotal === 1 ? "cartão" : "cartões"} para hoje: ${stats.pending.new} ${stats.pending.new === 1 ? "novo" : "novos"}, ${stats.pending.learning} para aprender e ${stats.pending.review} para revisar.`
              : hasStudied
                ? "Não há mais nada para estudar hoje. Volte amanhã para manter a sequência."
                : "Escolha um baralho e responda alguns cartões; aqui você acompanha tudo."}
            {todayRate !== null && ` Seu acerto de hoje é ${todayRate}%.`}
          </p>
          {pendingTotal > 0 && (
            <ButtonLink href={studyHref} className="mt-5">
              {stats.today.reviews > 0 ? "Continuar estudando" : "Estudar agora"}
            </ButtonLink>
          )}
        </section>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          <Tile
            label="Sequência"
            value={
              <>
                {stats.streak} <span className="text-lg text-muted">{stats.streak === 1 ? "dia" : "dias"}</span>
              </>
            }
            hint={
              stats.streak > 0
                ? `estudando em dias seguidos. Seu recorde é ${stats.bestStreak} ${stats.bestStreak === 1 ? "dia" : "dias"}.`
                : stats.bestStreak > 0
                  ? `Seu recorde é ${stats.bestStreak} ${stats.bestStreak === 1 ? "dia" : "dias"}. Estude hoje para começar outra.`
                  : "estude hoje para começar"
            }
          />
          <Tile
            label={`Acertos (${stats.days} dias)`}
            value={periodRate === null ? "—" : `${periodRate}%`}
            hint={
              periodRate === null
                ? "aparece depois das primeiras respostas"
                : `${periodCorrect.toLocaleString("pt-BR")} de ${periodReviews.toLocaleString("pt-BR")} respostas sem errar`
            }
          />
          <Tile
            label="Memória (30 dias)"
            value={stats.retention.rate === null ? "—" : `${Math.round(stats.retention.rate * 100)}%`}
            badge={stats.retention.rate === null ? undefined : { text: retention.label, tone: retention.tone }}
            hint={retention.text}
          />
          <Tile
            label="Cartões novos"
            value={stats.pace.newInPeriod.toLocaleString("pt-BR")}
            hint={
              stats.pace.newInPeriod
                ? `vistos pela primeira vez em ${stats.days} dias (${stats.pace.newPerDay.toLocaleString("pt-BR")} por dia)`
                : "nenhum cartão novo estudado no período"
            }
          />
          <Tile
            label="Ritmo"
            value={
              <>
                {stats.pace.perActiveDay} <span className="text-lg text-muted">por dia</span>
              </>
            }
            hint={
              stats.pace.secondsPerAnswer
                ? `nos dias em que você estuda, com cerca de ${stats.pace.secondsPerAnswer} s por resposta`
                : "respostas por dia em que você estuda"
            }
          />
          <Tile
            label="Tempo estudado"
            value={minutesLabel(stats.allTime.minutes)}
            hint={`${stats.allTime.reviews.toLocaleString("pt-BR")} respostas em ${stats.allTime.activeDays} ${stats.allTime.activeDays === 1 ? "dia" : "dias"}, desde o começo`}
          />
        </div>

        <Section
          title="Seu progresso"
          subtitle={`${stats.cards.total.toLocaleString("pt-BR")} ${stats.cards.total === 1 ? "cartão" : "cartões"} no total. Cada cartão passa por fases até ficar bem fixado na memória.`}
          tip={
            phaseTotal > 0
              ? `${seenPercent}% dos cartões já foram vistos e ${fixedPercent}% já estão bem fixados (voltam só depois de 3 semanas ou mais).`
              : undefined
          }
        >
          <StackedBar
            label="Cartões por fase"
            items={[
              { key: "new", label: "Novos", value: stats.cards.new, swatch: "bg-viz-1", hint: "ainda não estudados" },
              { key: "learning", label: "Aprendendo", value: stats.cards.learning, swatch: "bg-viz-2", hint: "você viu há pouco e ainda está fixando" },
              { key: "young", label: "Começando a fixar", value: stats.cards.young, swatch: "bg-viz-3", hint: "voltam em menos de 21 dias" },
              { key: "mature", label: "Bem fixados", value: stats.cards.mature, swatch: "bg-viz-4", hint: "voltam em 21 dias ou mais" },
              { key: "suspended", label: "Suspensos", value: stats.cards.suspended, swatch: "bg-viz-5", hint: "você tirou da fila de estudo" },
            ]}
          />
          {daysLeft !== null && (
            <p className="mt-5 text-pretty">
              No seu ritmo, você termina de ver os cartões novos em cerca de{" "}
              <strong className="font-display">{daysLabel(daysLeft)}</strong>. Quer ir mais rápido? Aumente o limite diário de cartões novos
              nas configurações do baralho.
            </p>
          )}
        </Section>

        <Section
          title="Sua constância"
          subtitle="Cada quadradinho é um dia. Quanto mais forte a cor, mais cartões você respondeu."
        >
          <ActivityCalendar days={stats.activity} label="Calendário de estudo das últimas 12 semanas" />
        </Section>

        <Section
          title="Respostas por dia"
          subtitle={`${periodReviews.toLocaleString("pt-BR")} ${periodReviews === 1 ? "resposta" : "respostas"} nos últimos ${stats.days} dias.`}
        >
          <ColumnChart
            data={history}
            fillClass="fill-primary"
            unit={{ one: "resposta", many: "respostas" }}
            label={`Respostas por dia nos últimos ${stats.days} dias`}
            valueHeader="Respostas"
          />
        </Section>

        <Section
          title="Como você responde"
          subtitle={`Quantas vezes você usou cada botão nos últimos ${stats.days} dias.`}
          tip={answerAdvice ?? undefined}
        >
          {periodReviews === 0 ? (
            <p className="text-muted">Responda alguns cartões para ver esta parte.</p>
          ) : (
            <BarList
              label="Uso de cada botão de resposta"
              items={answers.map((row) => ({
                key: row.key,
                label: row.label,
                hint: row.hint,
                value: row.count,
                display: `${row.percent}%`,
                barClass: { again: "bg-coral", hard: "bg-butter", good: "bg-primary", easy: "bg-sky" }[row.key],
              }))}
            />
          )}
        </Section>

        <Section
          title="Quando você estuda"
          subtitle={`Seus dias e horários mais fortes nos últimos ${stats.days} dias.`}
          tip={
            weekdayPeak >= 0 && hourPeak >= 0
              ? `Você estuda mais ${WEEKDAYS[weekdayPeak] === "sábado" || WEEKDAYS[weekdayPeak] === "domingo" ? "no" : "na"} ${WEEKDAYS[weekdayPeak]}, em geral entre ${hourRange(hourPeak)} (${dayPart(hourPeak)}).`
              : undefined
          }
        >
          {weekdayPeak < 0 ? (
            <p className="text-muted">Responda alguns cartões para ver esta parte.</p>
          ) : (
            <div className="flex flex-col gap-8">
              <div>
                <h3 className="mb-3 font-display text-lg font-semibold">Por dia da semana</h3>
                <BarList
                  label="Respostas por dia da semana"
                  items={WEEKDAYS.map((name, index) => ({
                    key: name,
                    label: name,
                    value: stats.byWeekday[index],
                    barClass: "bg-viz-1",
                    highlight: index === weekdayPeak,
                  }))}
                />
              </div>
              <div>
                <h3 className="mb-3 font-display text-lg font-semibold">Por hora do dia</h3>
                <ColumnChart
                  data={hours}
                  fillClass="fill-viz-3"
                  unit={{ one: "resposta", many: "respostas" }}
                  label="Respostas por hora do dia"
                  valueHeader="Respostas"
                  tickAnchor="start"
                />
              </div>
            </div>
          )}
        </Section>

        <Section
          title="Revisões previstas"
          subtitle={
            forecastTotal > 0
              ? `${forecastTotal.toLocaleString("pt-BR")} ${forecastTotal === 1 ? "cartão volta" : "cartões voltam"} nos próximos 30 dias. Em "hoje" entram os atrasados.`
              : "Nada previsto para os próximos 30 dias."
          }
          tip={
            busiest
              ? `Seu dia mais cheio será ${busiest.index === 0 ? "hoje" : sentenceDate(stats.forecast[busiest.index].date)}, com ${busiest.due.toLocaleString("pt-BR")} ${busiest.due === 1 ? "cartão" : "cartões"}.`
              : undefined
          }
        >
          <ColumnChart
            data={forecast}
            fillClass="fill-viz-1"
            unit={{ one: "cartão", many: "cartões" }}
            label="Cartões que voltam para revisão nos próximos 30 dias"
            valueHeader="Cartões"
            tickAnchor="start"
          />
        </Section>

        <Section
          title="Cartões que mais te dão trabalho"
          subtitle="Os que você mais errou depois de já ter aprendido. Vale olhar com atenção, ou reescrever com uma dica melhor."
        >
          {stats.hardest.length === 0 ? (
            <p className="text-muted">Nenhum cartão com erros ainda. Continue assim!</p>
          ) : (
            <ol className="flex flex-col gap-2">
              {stats.hardest.map((card, index) => (
                <li key={card.cardId} className="flex items-center gap-3 rounded-2xl bg-surface-soft px-4 py-3">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-surface font-display text-sm font-bold text-muted">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-semibold" title={card.text}>
                    {card.text}
                  </span>
                  <span className="shrink-0 text-sm font-semibold text-coral-edge">
                    {card.lapses} {card.lapses === 1 ? "erro" : "erros"}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Section>

        <details className="rounded-card border-2 border-border bg-surface p-6">
          <summary className="cursor-pointer font-display text-xl font-semibold">Como ler estes números</summary>
          <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
            {[
              ["Sequência", "Quantos dias seguidos você respondeu pelo menos um cartão. Falhar um dia zera a conta (o recorde fica guardado)."],
              ["Acertos", "Respostas em que você não apertou \"Errei\", em todos os cartões do período."],
              ["Memória", "Dos cartões que você já tinha aprendido e voltaram para revisão nos últimos 30 dias, quantos você acertou. Acima de 90% é ótimo."],
              ["Cartões novos", "Cartões que você viu pela primeira vez. Estudar poucos por dia deixa a revisão mais leve."],
              ["Aprendendo", "Cartões vistos há pouco, que voltam em minutos até você acertar algumas vezes."],
              ["Começando a fixar / Bem fixados", "Depois de aprendido, o cartão volta em intervalos cada vez maiores. Com 21 dias ou mais, ele já está bem fixado."],
              ["Suspensos", "Cartões que você tirou da fila de estudo; não entram nas contas de hoje."],
              ["Revisões previstas", "Quantos cartões voltam em cada dia, para você saber se vem uma semana pesada."],
            ].map(([term, text]) => (
              <div key={term}>
                <dt className="font-bold">{term}</dt>
                <dd className="mt-0.5 text-muted text-pretty">{text}</dd>
              </div>
            ))}
          </dl>
        </details>
      </div>
    </div>
  );
}
