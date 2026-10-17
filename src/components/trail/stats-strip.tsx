import { cn } from "@/lib/cn";
import type { TrailStats } from "@/lib/trail-types";

const weekday = new Intl.DateTimeFormat("pt-BR", { weekday: "narrow", timeZone: "UTC" });
const weekdayLong = new Intl.DateTimeFormat("pt-BR", { weekday: "long", timeZone: "UTC" });

/** Streak, XP e os últimos 7 dias, num bloco só. Sem estado: serve em servidor e cliente. */
export function StatsStrip({ stats, className }: { stats: TrailStats; className?: string }) {
  const { streak } = stats;
  const days = streak.current === 1 ? "dia" : "dias";

  return (
    <section
      aria-label="Seu progresso"
      className={cn(
        "flex flex-wrap items-center gap-x-8 gap-y-4 rounded-card border-2 border-border bg-surface px-6 py-5 shadow-[0_4px_0_0_var(--color-border)]",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className={cn(
            "grid size-12 place-items-center rounded-2xl text-2xl",
            streak.current > 0 ? "bg-coral-soft" : "bg-surface-soft grayscale",
          )}
        >
          🔥
        </span>
        <div>
          <p className="font-display text-2xl leading-none font-semibold tabular-nums">
            {streak.current} <span className="text-base font-medium text-muted">{days} seguidos</span>
          </p>
          <p className="mt-1 text-sm text-muted">
            {streak.activeToday
              ? "Hoje já valeu!"
              : streak.current > 0
                ? "Estude hoje para manter a sequência"
                : "Faça uma lição para começar"}
            {streak.longest > streak.current && ` · recorde ${streak.longest}`}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span aria-hidden className="grid size-12 place-items-center rounded-2xl bg-butter-soft text-2xl">
          ⭐
        </span>
        <div>
          <p className="font-display text-2xl leading-none font-semibold tabular-nums">
            {stats.xp} <span className="text-base font-medium text-muted">XP</span>
          </p>
          <p className="mt-1 text-sm text-muted">{stats.todayXp > 0 ? `+${stats.todayXp} hoje` : "Nenhum XP hoje ainda"}</p>
        </div>
      </div>

      <ol aria-label="Últimos 7 dias" className="ml-auto flex items-center gap-2">
        {stats.week.map((day, index) => {
          const label = weekdayLong.format(new Date(`${day.day}T12:00:00Z`));
          const isToday = index === stats.week.length - 1;
          return (
            <li
              key={day.day}
              title={`${label}: ${day.xp} XP`}
              className="flex flex-col items-center gap-1 text-xs font-bold text-muted"
            >
              <span
                className={cn(
                  "grid size-8 place-items-center rounded-full border-2",
                  day.xp > 0
                    ? "border-butter-edge bg-butter text-ink"
                    : isToday
                      ? "border-dashed border-border bg-surface"
                      : "border-border bg-surface-soft",
                )}
              >
                {day.xp > 0 ? "✓" : ""}
              </span>
              <span aria-hidden>{weekday.format(new Date(`${day.day}T12:00:00Z`)).toUpperCase()}</span>
              <span className="sr-only">
                {label}: {day.xp > 0 ? `${day.xp} XP` : "sem estudo"}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
