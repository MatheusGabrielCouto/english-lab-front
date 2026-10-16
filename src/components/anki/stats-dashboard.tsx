"use client";

import { useCallback, useState, type ReactNode } from "react";
import { ColumnChart, type ColumnDatum } from "@/components/charts/column-chart";
import { StackedBar } from "@/components/charts/stacked-bar";
import { Card } from "@/components/ui/card";
import { api, ApiError } from "@/lib/api-client";
import type { Stats } from "@/lib/anki-types";
import { cn } from "@/lib/cn";

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

function minutesLabel(minutes: number) {
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = Math.floor(minutes / 60);
  const rest = Math.round(minutes % 60);
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}

function Tile({ label, value, hint }: { label: string; value: ReactNode; hint: string }) {
  return (
    <Card className="p-5">
      <p className="text-sm font-semibold text-muted">{label}</p>
      <p className="mt-1 font-display text-4xl font-semibold leading-none">{value}</p>
      <p className="mt-2 text-sm text-muted">{hint}</p>
    </Card>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <section className="rounded-card border-2 border-border bg-surface p-6 shadow-[0_4px_0_0_var(--color-border)]">
      <h2 className="font-display text-2xl font-semibold">{title}</h2>
      <p className="mb-5 mt-1 text-sm text-muted">{subtitle}</p>
      {children}
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
  const todayRate = stats.today.reviews ? Math.round((stats.today.correct / stats.today.reviews) * 100) : null;
  const forecastTotal = stats.forecast.reduce((sum, day) => sum + day.due, 0);

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
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Tile
            label="Sequência"
            value={
              <>
                {stats.streak} <span className="text-lg text-muted">{stats.streak === 1 ? "dia" : "dias"}</span>
              </>
            }
            hint={stats.streak > 0 ? "estudando em dias seguidos" : "estude hoje para começar"}
          />
          <Tile
            label="Hoje"
            value={stats.today.reviews}
            hint={
              todayRate === null
                ? "nenhum cartão respondido ainda"
                : `${todayRate}% de acertos · ${minutesLabel(stats.today.minutes)}`
            }
          />
          <Tile
            label="Retenção (30 dias)"
            value={stats.retention.rate === null ? "—" : `${Math.round(stats.retention.rate * 100)}%`}
            hint={
              stats.retention.rate === null
                ? "aparece quando você revisar cartões antigos"
                : `acertos em ${stats.retention.sample} ${stats.retention.sample === 1 ? "revisão" : "revisões"} de cartões já aprendidos`
            }
          />
          <Tile
            label="Tempo estudado"
            value={minutesLabel(stats.allTime.minutes)}
            hint={`${stats.allTime.reviews.toLocaleString("pt-BR")} respostas em ${stats.allTime.activeDays} ${stats.allTime.activeDays === 1 ? "dia" : "dias"}`}
          />
        </div>

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
          title="Revisões previstas"
          subtitle={
            forecastTotal > 0
              ? `${forecastTotal.toLocaleString("pt-BR")} ${forecastTotal === 1 ? "cartão volta" : "cartões voltam"} nos próximos 30 dias. Em "hoje" entram os atrasados.`
              : "Nada previsto para os próximos 30 dias."
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
          title="Seus cartões"
          subtitle={`${stats.cards.total.toLocaleString("pt-BR")} ${stats.cards.total === 1 ? "cartão" : "cartões"} no total, por fase de aprendizado.`}
        >
          <StackedBar
            label="Cartões por fase"
            items={[
              { key: "new", label: "Novos", value: stats.cards.new, swatch: "bg-viz-1", hint: "ainda não estudados" },
              { key: "learning", label: "Aprendendo", value: stats.cards.learning, swatch: "bg-viz-2", hint: "em aprendizado ou reaprendizado" },
              { key: "young", label: "Jovens", value: stats.cards.young, swatch: "bg-viz-3", hint: "voltam em menos de 21 dias" },
              { key: "mature", label: "Maduros", value: stats.cards.mature, swatch: "bg-viz-4", hint: "voltam em 21 dias ou mais" },
              { key: "suspended", label: "Suspensos", value: stats.cards.suspended, swatch: "bg-viz-5", hint: "fora da fila de estudo" },
            ]}
          />
        </Section>
      </div>
    </div>
  );
}
