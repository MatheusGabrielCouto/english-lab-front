import { completeDaysInMonth, formatMonth, monthCalendar, WEEKDAYS } from "@/lib/checklist-format";
import type { DayState } from "@/lib/checklist-types";
import { cn } from "@/lib/cn";

const cellTone = (state: DayState | null, isFuture: boolean) => {
  if (isFuture || !state) return "bg-transparent text-muted/60";
  if (state.complete) return "bg-primary text-on-primary font-bold";
  if (state.percent >= 50) return "bg-butter text-ink font-semibold";
  if (state.percent > 0) return "bg-butter-soft text-foreground";
  return "bg-surface-soft text-muted";
};

/** O mês: cada dia colorido pelo quanto do checklist foi feito (verde = completo). */
export function HistoryCalendar({ today, history }: { today: string; history: DayState[] }) {
  const rows = monthCalendar(today, history);
  const complete = completeDaysInMonth(today, history);
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-display text-xl font-semibold">{formatMonth(today)}</h3>
        <p className="text-sm font-bold text-muted">
          {complete} {complete === 1 ? "dia completo" : "dias completos"}
        </p>
      </div>
      <div className="mt-3 grid grid-cols-7 gap-1.5 text-center sm:gap-2" role="table" aria-label="Calendário do mês">
        {WEEKDAYS.map((label, index) => (
          <div key={index} role="columnheader" aria-hidden className="text-xs font-bold text-muted">
            {label}
          </div>
        ))}
        {rows.flat().map((cell, index) =>
          cell.day === null ? (
            <div key={index} aria-hidden />
          ) : (
            <div
              key={cell.day}
              role="cell"
              title={cell.state ? `${cell.state.done} de ${cell.state.total} feitos` : undefined}
              className={cn(
                "grid aspect-square place-items-center rounded-xl text-sm tabular-nums",
                cellTone(cell.state, cell.day > today),
                cell.day === today && "ring-2 ring-foreground/50",
              )}
            >
              <span aria-hidden>{cell.day.slice(8).replace(/^0/, "")}</span>
              <span className="sr-only">
                {`dia ${Number(cell.day.slice(8))}: ${cell.state ? (cell.state.complete ? "completo" : `${cell.state.percent}%`) : "sem registro"}`}
              </span>
            </div>
          ),
        )}
      </div>
      <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-bold text-muted" aria-hidden>
        <span className="flex items-center gap-1.5"><span className="size-3 rounded bg-primary" /> completo</span>
        <span className="flex items-center gap-1.5"><span className="size-3 rounded bg-butter" /> 50% ou mais</span>
        <span className="flex items-center gap-1.5"><span className="size-3 rounded bg-butter-soft" /> começou</span>
      </p>
    </div>
  );
}
