import type { DiaryStats } from "@/lib/diary-types";

const nf = new Intl.NumberFormat("pt-BR");

/** Sequência, entradas, palavras e média: o hábito em quatro números. */
export function DiaryStatsStrip({ stats }: { stats: DiaryStats }) {
  const items = [
    { label: "Sequência", value: `🔥 ${stats.streak.current}`, hint: stats.streak.longest > stats.streak.current ? `recorde ${stats.streak.longest}` : stats.streak.current === 1 ? "dia" : "dias" },
    { label: "Entradas", value: nf.format(stats.entries), hint: stats.entries === 1 ? "texto escrito" : "textos escritos" },
    { label: "Palavras", value: nf.format(stats.words), hint: "no total" },
    { label: "Média", value: nf.format(stats.averageWords), hint: "por entrada" },
  ];
  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="rounded-card border-2 border-border bg-surface px-4 py-3 shadow-[0_4px_0_0_var(--color-border)]">
          <dt className="text-sm font-bold text-muted">{item.label}</dt>
          <dd className="mt-0.5 font-display text-3xl leading-tight font-semibold tabular-nums">{item.value}</dd>
          <dd className="text-xs font-semibold text-muted">{item.hint}</dd>
        </div>
      ))}
    </dl>
  );
}
