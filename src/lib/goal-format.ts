import type { GoalPlan, GoalStatus } from "@/lib/goal-types";
import { LEVELS, type Level } from "@/lib/trail-types";

/** "45 min", "2 h", "2 h 30 min". Arredonda para o minuto. */
export function formatMinutes(total: number): string {
  const minutes = Math.max(0, Math.round(total));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

const dayFormat = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const shortDayFormat = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short", timeZone: "UTC" });

const asDate = (day: string) => new Date(`${day}T12:00:00Z`);

/** "12 de março de 2027" */
export const formatDay = (day: string) => dayFormat.format(asDate(day));
/** "12 mar." */
export const formatShortDay = (day: string) => shortDayFormat.format(asDate(day));

export function addDays(day: string, days: number): string {
  const date = asDate(day);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function addMonths(day: string, months: number): string {
  const date = asDate(day);
  const targetMonth = date.getUTCMonth() + months;
  const dayOfMonth = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(targetMonth);
  // 31 de março + 1 mês cai em 30 de abril, e não em 1º de maio
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(dayOfMonth, lastDay));
  return date.toISOString().slice(0, 10);
}

export function daysBetween(a: string, b: string): number {
  return Math.round((asDate(b).getTime() - asDate(a).getTime()) / 86_400_000);
}

/** Horas do começo do nível `start` até o fim do `target` (os dois incluídos), pela tabela do servidor. */
export function hoursBetween(table: Record<Level, number>, start: Level, target: Level): number {
  const from = LEVELS.findIndex((item) => item.level === start);
  const to = LEVELS.findIndex((item) => item.level === target);
  if (to < from) return 0;
  const before = from === 0 ? 0 : table[LEVELS[from - 1].level];
  return table[target] - before;
}

export const DEADLINE_PRESETS = [
  { label: "6 meses", months: 6 },
  { label: "9 meses", months: 9 },
  { label: "1 ano", months: 12 },
  { label: "18 meses", months: 18 },
  { label: "2 anos", months: 24 },
] as const;

export const TARGET_LEVELS: { level: Level; title: string; text: string; recommended?: boolean }[] = [
  { level: "B1", title: "Intermediário", text: "Conversa do dia a dia e leitura de documentação." },
  {
    level: "B2",
    title: "Intermediário avançado",
    text: "Reuniões, e-mails e entrevistas em time internacional. É o ponto de partida de muitas vagas.",
    recommended: true,
  },
  { level: "C1", title: "Avançado", text: "Fluência profissional: liderar, negociar e defender ideias." },
  { level: "C2", title: "Proficiente", text: "Muito próximo de um falante nativo." },
];

type StatusInfo = { tone: "primary" | "sky" | "coral" | "butter"; icon: string; title: string };

const STATUS: Record<GoalStatus, StatusInfo> = {
  done: { tone: "primary", icon: "🎉", title: "Meta concluída!" },
  ahead: { tone: "primary", icon: "🚀", title: "Você está adiantado" },
  "on-track": { tone: "sky", icon: "✅", title: "Você está no ritmo" },
  behind: { tone: "butter", icon: "⏳", title: "Dá para recuperar" },
  overdue: { tone: "coral", icon: "📅", title: "O prazo passou" },
};

export const statusInfo = (status: GoalStatus) => STATUS[status];

/** Uma frase sobre onde o aluno está em relação ao prazo, em português. */
export function statusMessage(plan: GoalPlan): string {
  const { status, projectedDay, recentAverage, dailyTargetMinutes } = plan;
  switch (status) {
    case "done":
      return "Você estudou todas as horas previstas para o nível da sua meta. Hora de entrevistas e de vagas!";
    case "overdue":
      return "A data da meta já passou e ainda faltam horas. Sem problema: ajuste a data e continue de onde parou.";
    case "ahead":
      return `Você já fez ${plan.percent}% das horas com ${plan.timePercent}% do prazo gasto. Mantenha o ritmo.`;
    case "on-track":
      return `Para chegar na data, estude cerca de ${formatMinutes(dailyTargetMinutes)} por dia.`;
    case "behind": {
      const base = `Você fez ${plan.percent}% das horas e ${plan.timePercent}% do prazo já passou.`;
      if (recentAverage > 0 && projectedDay) {
        return `${base} No seu ritmo atual (${formatMinutes(recentAverage)} por dia) você chega em ${formatDay(projectedDay)}.`;
      }
      return `${base} Estudar ${formatMinutes(dailyTargetMinutes)} por dia traz você de volta ao plano.`;
    }
  }
}

/** Cada dia vale um passo: um texto curto para a meta de hoje. */
export function todayMessage(plan: GoalPlan): string {
  if (plan.status === "done") return "Meta concluída: continue praticando para manter o inglês afiado.";
  if (plan.todayLeftMinutes === 0) return "Meta de hoje cumprida. Bom trabalho!";
  if (plan.todayMinutes === 0) return `Comece com uma lição: faltam ${formatMinutes(plan.todayLeftMinutes)} para a meta de hoje.`;
  return `Faltam ${formatMinutes(plan.todayLeftMinutes)} para a meta de hoje.`;
}

export const SOURCE_LABEL = {
  lesson: "Lições",
  anki: "Anki",
  reading: "Leitura",
  interview: "Entrevistas",
  diary: "Diário",
  checklist: "Treinos do checklist",
  manual: "Fora da plataforma",
} as const;
