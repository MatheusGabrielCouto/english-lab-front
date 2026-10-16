"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { cn } from "@/lib/cn";

export type ColumnDatum = {
  key: string;
  /** rótulo do eixo X (já curto) */
  tick: string;
  /** título na dica e na tabela */
  title: string;
  value: number;
  /** linha extra na dica (ex.: acertos) */
  detail?: string;
};

const HEIGHT = 240;
const MARGIN = { top: 22, right: 8, bottom: 28, left: 40 };
const MAX_BAR = 24; // marcas finas: nunca preenchem o espaço todo
const TICK_GAP = 56; // distância mínima entre rótulos do eixo X

/** Escala "bonita": 0 a topo em passos de 1, 2 ou 5 × 10ⁿ (até ~4 faixas). */
function niceScale(max: number) {
  if (max <= 0) return { top: 4, ticks: [0, 1, 2, 3, 4] };
  const rough = Math.max(1, max / 4);
  const exp = 10 ** Math.floor(Math.log10(rough));
  const fraction = rough / exp;
  const step = Math.max(1, (fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10) * exp);
  const top = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let value = 0; value <= top; value += step) ticks.push(value);
  return { top, ticks };
}

/** Barra com o topo arredondado (4px) e a base reta, colada na linha de base. */
function barPath(x: number, y: number, width: number, height: number) {
  const r = Math.min(4, width / 2, height);
  return `M${x},${y + height}V${y + r}Q${x},${y} ${x + r},${y}H${x + width - r}Q${x + width},${y} ${x + width},${y + r}V${y + height}Z`;
}

export function ColumnChart({
  data,
  fillClass,
  unit,
  label,
  valueHeader,
  tickAnchor = "end",
  className,
}: {
  data: ColumnDatum[];
  /** classe de preenchimento das barras, ex.: "fill-primary" */
  fillClass: string;
  unit: { one: string; many: string };
  /** descrição do gráfico (leitores de tela e legenda da tabela) */
  label: string;
  valueHeader: string;
  /** de que ponta contar os rótulos espaçados do eixo X (histórico: fim; previsão: início) */
  tickAnchor?: "start" | "end";
  className?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  const [active, setActive] = useState<number | null>(null);
  const announce = useId();

  // acompanha a largura real, para os textos nunca ficarem encolhidos
  useEffect(() => {
    const element = box.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(240, Math.round(entry.contentRect.width))));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const innerW = width - MARGIN.left - MARGIN.right;
  const innerH = HEIGHT - MARGIN.top - MARGIN.bottom;
  const count = data.length;
  const max = Math.max(0, ...data.map((d) => d.value));
  const { top, ticks } = niceScale(max);
  const slot = innerW / Math.max(count, 1);
  const barW = Math.min(MAX_BAR, Math.max(1.5, slot * 0.7));
  const y = (value: number) => MARGIN.top + innerH - (value / top) * innerH;
  const cx = (index: number) => MARGIN.left + slot * (index + 0.5);
  const everyN = Math.max(1, Math.ceil(TICK_GAP / slot));
  const peak = max > 0 ? data.findIndex((d) => d.value === max) : -1;

  const format = (n: number) => n.toLocaleString("pt-BR");
  const unitOf = (n: number) => (n === 1 ? unit.one : unit.many);
  const current = active === null ? null : data[active];

  function indexFromPointer(event: PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const index = Math.floor((event.clientX - rect.left - MARGIN.left) / slot);
    return index >= 0 && index < count ? index : null;
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (count === 0) return;
    const last = count - 1;
    const next =
      event.key === "ArrowRight" ? Math.min(last, (active ?? last) + 1)
      : event.key === "ArrowLeft" ? Math.max(0, (active ?? last) - 1)
      : event.key === "Home" ? 0
      : event.key === "End" ? last
      : null;
    if (event.key === "Escape") setActive(null);
    if (next === null) return;
    event.preventDefault();
    setActive(next);
  }

  return (
    <div className={className}>
      <div
        ref={box}
        role="group"
        aria-label={`${label}. Use as setas para percorrer os valores.`}
        aria-describedby={announce}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onFocus={() => setActive((value) => value ?? count - 1)}
        onBlur={() => setActive(null)}
        onPointerMove={(event) => setActive(indexFromPointer(event))}
        onPointerLeave={() => setActive(null)}
        className="relative touch-pan-y select-none rounded-xl"
        style={{ height: HEIGHT }}
      >
        <svg width={width} height={HEIGHT} aria-hidden className="block overflow-visible">
          {/* grade e eixo Y: linhas finas, contínuas e discretas */}
          {ticks.map((tick) => (
            <g key={tick}>
              <line
                x1={MARGIN.left}
                x2={width - MARGIN.right}
                y1={y(tick)}
                y2={y(tick)}
                className={tick === 0 ? "stroke-muted/60" : "stroke-border"}
                strokeWidth={1}
              />
              <text x={MARGIN.left - 8} y={y(tick)} textAnchor="end" dominantBaseline="middle" className="fill-muted text-[11px]">
                {format(tick)}
              </text>
            </g>
          ))}

          {/* eixo X: rótulos espaçados, sempre incluindo a ponta âncora */}
          {data.map((d, index) =>
            (tickAnchor === "start" ? index : count - 1 - index) % everyN === 0 ? (
              <text key={d.key} x={cx(index)} y={HEIGHT - 8} textAnchor="middle" className="fill-muted text-[11px]">
                {d.tick}
              </text>
            ) : null,
          )}

          {/* barras */}
          {data.map((d, index) =>
            d.value > 0 ? (
              <path
                key={d.key}
                d={barPath(cx(index) - barW / 2, y(d.value), barW, y(0) - y(d.value))}
                className={cn(fillClass, "transition-[filter] duration-100")}
                style={active === index ? { filter: "brightness(1.18)" } : undefined}
              />
            ) : null,
          )}

          {/* rótulo direto só no maior valor; o resto fica na grade e na dica */}
          {peak >= 0 && (
            <text
              x={Math.min(Math.max(cx(peak), MARGIN.left + 12), width - MARGIN.right - 12)}
              y={y(max) - 6}
              textAnchor="middle"
              className="fill-foreground text-[12px] font-bold"
            >
              {format(max)}
            </text>
          )}
        </svg>

        {/* dica: o valor em destaque, o nome depois */}
        {current && (
          <div
            role="presentation"
            className="pointer-events-none absolute z-10 w-max max-w-56 rounded-xl border-2 border-border bg-surface px-3 py-2 text-sm shadow-lg"
            style={{
              top: 4,
              left: Math.min(Math.max(cx(active!), 70), width - 70),
              transform: "translateX(-50%)",
            }}
          >
            <p className="text-xs font-semibold text-muted">{current.title}</p>
            <p className="font-display text-lg font-semibold leading-tight">
              {format(current.value)} <span className="text-sm font-semibold text-muted">{unitOf(current.value)}</span>
            </p>
            {current.detail && <p className="text-xs text-muted">{current.detail}</p>}
          </div>
        )}
      </div>

      <p id={announce} aria-live="polite" className="sr-only">
        {current ? `${current.title}: ${format(current.value)} ${unitOf(current.value)}. ${current.detail ?? ""}` : ""}
      </p>

      <details className="mt-3 text-sm">
        <summary className="w-fit cursor-pointer rounded-pill px-3 py-1 font-semibold text-muted transition-colors hover:bg-surface-soft hover:text-foreground">
          Ver como tabela
        </summary>
        <div className="mt-2 max-h-72 overflow-auto rounded-2xl border-2 border-border">
          <table className="w-full text-left">
            <caption className="sr-only">{label}</caption>
            <thead className="sticky top-0 bg-surface-soft">
              <tr>
                <th scope="col" className="px-4 py-2 font-bold">
                  Dia
                </th>
                <th scope="col" className="px-4 py-2 text-right font-bold">
                  {valueHeader}
                </th>
              </tr>
            </thead>
            <tbody>
              {[...data].reverse().map((d) => (
                <tr key={d.key} className="border-t border-border">
                  <th scope="row" className="px-4 py-1.5 font-normal text-muted">
                    {d.title}
                  </th>
                  <td className="px-4 py-1.5 text-right tabular-nums">{format(d.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
