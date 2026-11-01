import type { Stats } from "@/lib/anki-types";

export const WEEKDAYS = ["segunda", "terça", "quarta", "quinta", "sexta", "sábado", "domingo"] as const;

export type Tone = "good" | "ok" | "warn" | "neutral";

/** Retenção (acerto em cartões já aprendidos) traduzida para uma frase que qualquer pessoa entende. */
export function retentionLevel(rate: number | null): { tone: Tone; label: string; text: string } {
  if (rate === null) {
    return { tone: "neutral", label: "Sem dados", text: "Aparece quando você revisar cartões que já aprendeu." };
  }
  const percent = Math.round(rate * 100);
  if (percent >= 90) {
    return { tone: "good", label: "Ótimo", text: `Você lembra de ${percent} em cada 100 cartões. Sua memória está firme.` };
  }
  if (percent >= 80) {
    return { tone: "ok", label: "Bom", text: `Você lembra de ${percent} em cada 100 cartões. Está no caminho certo.` };
  }
  return {
    tone: "warn",
    label: "Atenção",
    text: `Você lembra de ${percent} em cada 100 cartões. Tente revisar todo dia e estudar menos cartões novos.`,
  };
}

export type AnswerRow = { key: "again" | "hard" | "good" | "easy"; label: string; hint: string; count: number; percent: number };

/** Percentual de uso de cada botão, com o que ele significa. */
export function answerRows(answers: Stats["answers"]): AnswerRow[] {
  const total = answers.again + answers.hard + answers.good + answers.easy;
  const row = (key: AnswerRow["key"], label: string, hint: string): AnswerRow => ({
    key,
    label,
    hint,
    count: answers[key],
    percent: total ? Math.round((answers[key] / total) * 100) : 0,
  });
  return [
    row("again", "Errei", "não lembrou; o cartão volta em minutos"),
    row("hard", "Difícil", "lembrou com esforço"),
    row("good", "Bom", "lembrou normalmente"),
    row("easy", "Fácil", "lembrou na hora; demora mais para voltar"),
  ];
}

/** Uma dica sobre como a pessoa responde, ou `null` quando ainda há pouco dado. */
export function answerTip(answers: Stats["answers"]): string | null {
  const total = answers.again + answers.hard + answers.good + answers.easy;
  if (total < 20) return null;
  const again = answers.again / total;
  const easy = answers.easy / total;
  if (again > 0.3) return "Você errou bastante. Diminuir os cartões novos por dia ajuda a fixar melhor o que já viu.";
  if (easy > 0.5) return "Você acha muita coisa fácil. Pode aumentar o limite de cartões novos por dia.";
  return "Seu equilíbrio entre erros e acertos está bom.";
}

/** Posição do maior valor, ou -1 se tudo for zero. */
export function peakIndex(values: number[]): number {
  const max = Math.max(0, ...values);
  return max > 0 ? values.indexOf(max) : -1;
}

/** "20h" → "20h às 21h" */
export function hourRange(hour: number): string {
  return `${hour}h às ${(hour + 1) % 24}h`;
}

export function dayPart(hour: number): string {
  if (hour < 6) return "madrugada";
  if (hour < 12) return "manhã";
  if (hour < 18) return "tarde";
  return "noite";
}

/** Quantos dias faltam para ver todos os cartões novos, no ritmo recente (ou `null` sem ritmo). */
export function daysToFinishNew(newLeft: number, newPerDay: number): number | null {
  if (newLeft <= 0 || newPerDay <= 0) return null;
  return Math.ceil(newLeft / newPerDay);
}

export function daysLabel(days: number): string {
  if (days < 45) return `${days} ${days === 1 ? "dia" : "dias"}`;
  const months = Math.round(days / 30);
  return months < 18 ? `${months} meses` : `${(days / 365).toFixed(1).replace(".", ",")} anos`;
}

/** O dia da previsão com mais revisões (índice) e quantas são; `null` se não houver nada. */
export function busiestForecastDay(forecast: Stats["forecast"]): { index: number; due: number } | null {
  let best: { index: number; due: number } | null = null;
  forecast.forEach((day, index) => {
    if (day.due > 0 && (!best || day.due > best.due)) best = { index, due: day.due };
  });
  return best;
}

/** Nível de 0 a 4 para pintar o calendário de atividade. */
export function activityLevel(reviews: number, max: number): 0 | 1 | 2 | 3 | 4 {
  if (reviews <= 0 || max <= 0) return 0;
  const ratio = reviews / max;
  if (ratio > 0.75) return 4;
  if (ratio > 0.5) return 3;
  if (ratio > 0.25) return 2;
  return 1;
}

/** Porcentagem inteira de `part` em `total` (0 se total for 0). */
export function percentOf(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}
