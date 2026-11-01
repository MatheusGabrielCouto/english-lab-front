import { cn } from "@/lib/cn";

export type BarListItem = {
  key: string;
  label: string;
  /** explicação curta ao lado do rótulo */
  hint?: string;
  value: number;
  /** texto à direita (ex.: "42%"); por padrão, o número */
  display?: string;
  /** classe de fundo da barra, ex.: "bg-primary" */
  barClass: string;
  highlight?: boolean;
};

/** Barras horizontais com rótulo e valor ao lado: para poucas categorias que precisam ser lidas, não só vistas. */
export function BarList({ items, label }: { items: BarListItem[]; label: string }) {
  const max = Math.max(1, ...items.map((item) => item.value));
  return (
    <ul aria-label={label} className="flex flex-col gap-3">
      {items.map((item) => (
        <li key={item.key} className="grid grid-cols-[5.5rem_1fr_3.5rem] items-center gap-x-3 gap-y-0.5 sm:grid-cols-[7rem_1fr_4rem]">
          <span className={cn("text-sm font-bold capitalize", item.highlight && "text-primary")}>{item.label}</span>
          <span className="h-3.5 overflow-hidden rounded-pill bg-surface-soft" aria-hidden>
            <span
              className={cn("block h-full rounded-pill transition-[width] duration-300", item.barClass)}
              style={{ width: `${Math.max(item.value > 0 ? 3 : 0, (item.value / max) * 100)}%` }}
            />
          </span>
          <span className="text-right text-sm font-semibold tabular-nums">{item.display ?? item.value.toLocaleString("pt-BR")}</span>
          {item.hint && <span className="col-start-2 text-xs text-muted">{item.hint}</span>}
        </li>
      ))}
    </ul>
  );
}
