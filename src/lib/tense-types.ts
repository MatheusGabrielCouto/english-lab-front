export type Tense = "presente" | "passado" | "futuro" | "perfeito";
export type DiaryTense = Exclude<Tense, "perfeito">;
export type TenseLevel = "none" | "weak" | "ok" | "strong";

export type Tally = { answers: number; correct: number; accuracy: number | null };

export type TenseRow = {
  tense: Tense;
  label: string;
  /** cartões do Anki marcados com este tempo */
  cards: number;
  anki: Tally;
  trail: Tally;
  answers: number;
  correct: number;
  accuracy: number | null;
  level: TenseLevel;
};

export type WeakSpot = {
  tense: Tense;
  source: "anki" | "trail";
  prompt: string;
  answer: string | null;
  misses: number;
  attempts: number;
};

export type TensesOverview = {
  days: number;
  tenses: TenseRow[];
  weakSpots: WeakSpot[];
  suggestion: { tense: Tense | null; text: string };
};

/** Quantas frases do diário estão em cada tempo. */
export type TenseCounts = Record<Tense, number>;

export type TenseFocus = {
  tense: DiaryTense;
  title: string;
  task: string;
  starters: string[];
  goal: number;
};
