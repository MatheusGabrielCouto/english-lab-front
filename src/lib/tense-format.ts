import type { Tense, TenseCounts, TenseFocus, TenseLevel, TenseRow } from "@/lib/tense-types";

export const TENSE_ORDER: Tense[] = ["passado", "presente", "futuro", "perfeito"];

type Style = { emoji: string; clue: string; example: string; soft: string; solid: string };

/** Cor e exemplo de cada tempo (as mesmas em todas as telas, para o aluno associar). */
export const TENSE_STYLE: Record<Tense, Style> = {
  passado: { emoji: "⏪", clue: "yesterday, ago, last week", example: "I went to the gym yesterday.", soft: "bg-lavender-soft border-lavender/40", solid: "bg-lavender" },
  presente: { emoji: "▶️", clue: "every day, always, now", example: "I go to the gym every day.", soft: "bg-primary-soft border-primary/30", solid: "bg-primary" },
  futuro: { emoji: "⏩", clue: "tomorrow, next week, soon", example: "I will go to the gym tomorrow.", soft: "bg-butter-soft border-butter/60", solid: "bg-butter" },
  perfeito: { emoji: "✅", clue: "already, just, ever, for, since", example: "I have gone to the gym already.", soft: "bg-coral-soft border-coral/40", solid: "bg-coral" },
};

export const LEVEL_LABEL: Record<TenseLevel, string> = {
  none: "Poucos dados",
  weak: "Precisa de reforço",
  ok: "Quase lá",
  strong: "Forte",
};

export const LEVEL_CLASS: Record<TenseLevel, string> = {
  none: "bg-surface-soft text-muted",
  weak: "bg-coral-soft text-foreground",
  ok: "bg-butter-soft text-foreground",
  strong: "bg-primary-soft text-foreground",
};

export const SOURCE_LABEL = { anki: "Anki", trail: "Trilha" } as const;

export const percentText = (value: number | null) => (value === null ? "–" : `${value}%`);

/** "12 respostas", "1 resposta". */
export const answersText = (count: number) => `${count} ${count === 1 ? "resposta" : "respostas"}`;

/** "errou 3 de 4 vezes". */
export function missesText(misses: number, attempts: number) {
  if (attempts === 1) return "errou na única vez";
  return `errou ${misses} de ${attempts} vezes`;
}

/** Os tempos que o aluno ainda não usou no texto, entre os três do diário. */
export function missingInText(counts: TenseCounts | null): Exclude<Tense, "perfeito">[] {
  const three = ["passado", "presente", "futuro"] as const;
  if (!counts) return [...three];
  return three.filter((tense) => counts[tense] === 0);
}

/** Quanto falta para a meta do tempo do dia (0 = cumprida). */
export const focusRemaining = (focus: TenseFocus, counts: TenseCounts | null) => Math.max(0, focus.goal - (counts?.[focus.tense] ?? 0));

/** A linha de tempo mais fraca (menor acerto), para destacar na tela. */
export function weakestRow(rows: TenseRow[]): TenseRow | null {
  const weak = rows.filter((row) => row.level === "weak").sort((a, b) => (a.accuracy ?? 100) - (b.accuracy ?? 100));
  return weak[0] ?? null;
}
