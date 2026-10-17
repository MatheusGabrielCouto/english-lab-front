import Link from "next/link";
import { cn } from "@/lib/cn";
import type { Level } from "@/lib/trail-types";
import type { LevelSummary } from "@/lib/trail-view";

/** Abas dos seis níveis. São links (`?nivel=a2`): funcionam sem JavaScript e o botão voltar do navegador entende. */
export function LevelTabs({
  summaries,
  selected,
  placement,
}: {
  summaries: LevelSummary[];
  selected: Level;
  placement: Level | null;
}) {
  return (
    <nav
      aria-label="Níveis"
      className="sticky top-0 z-10 -mx-5 overflow-x-auto bg-background/90 px-5 py-3 backdrop-blur [scrollbar-width:none]"
    >
      <ul className="flex min-w-max gap-2.5 md:min-w-0 md:justify-between">
        {summaries.map((summary) => {
          const active = summary.level === selected;
          const percent = summary.lessons === 0 ? 0 : Math.round((summary.done / summary.lessons) * 100);
          return (
            <li key={summary.level} className="md:flex-1">
              <Link
                href={`/trilha?nivel=${summary.level.toLowerCase()}`}
                scroll={false}
                aria-current={active ? "page" : undefined}
                aria-label={`${summary.level}, ${summary.name}: ${
                  summary.hasContent ? `${summary.done} de ${summary.lessons} lições` : "em breve"
                }${placement === summary.level ? ", seu nível" : ""}`}
                className={cn(
                  "relative flex min-w-24 flex-col gap-1.5 rounded-2xl border-2 px-4 py-2.5 transition-colors",
                  active
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-surface hover:border-sky hover:bg-surface-soft",
                  !summary.hasContent && !active && "text-muted",
                )}
              >
                <span className="flex items-baseline justify-between gap-2">
                  <span className="font-display text-xl leading-none font-semibold">{summary.level}</span>
                  <span className={cn("text-xs font-bold tabular-nums", active ? "opacity-80" : "text-muted")}>
                    {summary.hasContent ? `${summary.done}/${summary.lessons}` : "em breve"}
                  </span>
                </span>
                <span
                  aria-hidden
                  className={cn("h-1.5 overflow-hidden rounded-pill", active ? "bg-background/25" : "bg-surface-soft")}
                >
                  <span
                    className={cn("block h-full rounded-pill", active ? "bg-butter" : "bg-primary")}
                    style={{ width: `${percent}%` }}
                  />
                </span>
                {placement === summary.level && (
                  <span
                    aria-hidden
                    title="Seu nível no teste"
                    className="absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-full bg-butter text-[0.7rem] text-ink shadow-[0_2px_0_0_var(--color-butter-edge)]"
                  >
                    ★
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
