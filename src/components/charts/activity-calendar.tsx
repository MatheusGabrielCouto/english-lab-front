"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { activityLevel } from "@/lib/stats-insights";

export type CalendarDay = { date: string; reviews: number };

const LEVELS = ["bg-surface-soft", "bg-primary/25", "bg-primary/50", "bg-primary/75", "bg-primary"] as const;
const WEEKDAY_LABELS = ["seg", "", "qua", "", "sex", "", "dom"];

function longDate(key: string) {
  return new Date(`${key}T00:00:00Z`).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    timeZone: "UTC",
  });
}

/** Segunda = 0 … domingo = 6, sem passar por fuso (a chave já é a data local). */
function weekdayIndex(key: string) {
  return (new Date(`${key}T00:00:00Z`).getUTCDay() + 6) % 7;
}

/**
 * Calendário de constância: uma coluna por semana, uma linha por dia da semana.
 * Quanto mais forte a cor, mais cartões naquele dia; a leitura exata vem ao passar o mouse ou focar.
 */
export function ActivityCalendar({ days, label }: { days: CalendarDay[]; label: string }) {
  const [active, setActive] = useState<CalendarDay | null>(null);
  const max = Math.max(0, ...days.map((day) => day.reviews));

  // monta as semanas; a primeira pode começar no meio, então preenchemos antes com vazios
  const lead = days.length ? weekdayIndex(days[0].date) : 0;
  const cells: (CalendarDay | null)[] = [...Array.from({ length: lead }, () => null), ...days];
  const weeks: (CalendarDay | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const studiedDays = days.filter((day) => day.reviews > 0).length;
  const format = (n: number) => n.toLocaleString("pt-BR");

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label={label}>
        <div className="grid shrink-0 grid-rows-7 gap-1.5 text-xs font-semibold text-muted" aria-hidden>
          {WEEKDAY_LABELS.map((text, index) => (
            <span key={index} className="flex h-6 items-center">
              {text}
            </span>
          ))}
        </div>
        <div className="flex gap-1.5">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-rows-7 gap-1.5">
              {Array.from({ length: 7 }, (_, row) => {
                const day = week[row];
                if (!day) return <span key={row} className="size-6" aria-hidden />;
                return (
                  <button
                    key={day.date}
                    type="button"
                    onPointerEnter={() => setActive(day)}
                    onPointerLeave={() => setActive(null)}
                    onFocus={() => setActive(day)}
                    onBlur={() => setActive(null)}
                    aria-label={`${longDate(day.date)}: ${format(day.reviews)} ${day.reviews === 1 ? "resposta" : "respostas"}`}
                    className={cn(
                      "size-6 rounded-md border border-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky",
                      LEVELS[activityLevel(day.reviews, max)],
                    )}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <p className="mt-3 min-h-5 text-sm text-muted" aria-live="polite">
        {active
          ? `${longDate(active.date)}: ${format(active.reviews)} ${active.reviews === 1 ? "resposta" : "respostas"}`
          : `Você estudou em ${studiedDays} dos últimos ${days.length} dias.`}
      </p>

      <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-muted" aria-hidden>
        menos
        {LEVELS.map((level) => (
          <span key={level} className={cn("size-3.5 rounded-[3px] border border-foreground/10", level)} />
        ))}
        mais
      </div>
    </div>
  );
}
