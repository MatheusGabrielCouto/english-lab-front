import Link from "next/link";
import { formatWeekDay } from "@/lib/diary-format";
import { cn } from "@/lib/cn";

/** Hoje e os 7 dias anteriores: os pontos verdes são os dias escritos; clique para escrever ou ler um dia. */
export function WeekStrip({ week, today }: { week: { day: string; written: boolean }[]; today: string }) {
  return (
    <nav aria-label="Últimos dias" className="relative flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {week.map((entry) => (
        <Link
          key={entry.day}
          href={entry.day === today ? "/diario" : `/diario/${entry.day}`}
          aria-current={entry.day === today ? "date" : undefined}
          className={cn(
            "flex shrink-0 flex-col items-center gap-1 rounded-2xl border-2 px-3 py-2 text-sm font-semibold transition-colors",
            entry.day === today ? "border-foreground bg-surface-soft" : "border-border bg-surface text-muted hover:border-sky hover:text-foreground",
          )}
        >
          <span>{entry.day === today ? "hoje" : formatWeekDay(entry.day)}</span>
          <span aria-hidden className={cn("size-3 rounded-full", entry.written ? "bg-primary-edge" : "bg-surface-soft ring-2 ring-border")} />
          <span className="sr-only">{entry.written ? "escrito" : "sem texto"}</span>
        </Link>
      ))}
    </nav>
  );
}
