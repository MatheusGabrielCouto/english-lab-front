import type { ChecklistItem, DayState } from "@/lib/checklist-types";

const longDay = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
const monthName = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });
const asDate = (day: string) => new Date(`${day}T12:00:00Z`);

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** "Terça-feira, 20 de outubro" */
export const formatLongDay = (day: string) => capitalize(longDay.format(asDate(day)));
/** "Outubro de 2026" */
export const formatMonth = (day: string) => capitalize(monthName.format(asDate(day)));

/** O que mostrar embaixo do nome do item: progresso, origem ou minutos. */
export function itemDetail(item: ChecklistItem): string | null {
  const { progress } = item;
  if (item.source === "manual") return item.minutes ? `Marcado por você · ${item.minutes} min` : "Marcado por você";
  if (progress && item.source === "auto") return `Feito: ${progress.current} ${progress.unit}`;
  if (progress) return `${progress.current} de ${progress.target} ${progress.unit}`;
  return null;
}

export type CalendarCell = { day: string | null; state: DayState | null };

/**
 * O calendário do mês de `today`: linhas de 7 dias (domingo a sábado), com células vazias antes do
 * dia 1 e depois do último dia do mês. Dias sem registro no histórico ficam sem estado.
 */
export function monthCalendar(today: string, history: DayState[]): CalendarCell[][] {
  const [year, month] = today.split("-").map(Number);
  const byDay = new Map(history.map((entry) => [entry.day, entry]));
  const first = new Date(Date.UTC(year, month - 1, 1));
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells: CalendarCell[] = Array.from({ length: first.getUTCDay() }, () => ({ day: null, state: null }));
  for (let dayOfMonth = 1; dayOfMonth <= daysInMonth; dayOfMonth++) {
    const day = `${year}-${String(month).padStart(2, "0")}-${String(dayOfMonth).padStart(2, "0")}`;
    cells.push({ day, state: byDay.get(day) ?? null });
  }
  while (cells.length % 7 !== 0) cells.push({ day: null, state: null });
  return Array.from({ length: cells.length / 7 }, (_, row) => cells.slice(row * 7, row * 7 + 7));
}

/** Quantos dias do mês até hoje estavam completos. */
export function completeDaysInMonth(today: string, history: DayState[]) {
  const prefix = today.slice(0, 7);
  return history.filter((entry) => entry.day.startsWith(prefix) && entry.day <= today && entry.complete).length;
}

export const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"] as const;

/** Mensagem curta sobre o dia, para o topo da tela. */
export function dayMessage(done: number, total: number, complete: boolean) {
  if (total === 0) return "Ligue alguns itens em “Personalizar” para montar o seu dia.";
  if (complete) return "Dia completo! Amanhã tem mais.";
  if (done === 0) return "Comece por um item pequeno: uma lição ou 5 revisões já contam.";
  const left = total - done;
  return left === 1 ? "Falta só um item para fechar o dia." : `Faltam ${left} itens para fechar o dia.`;
}
