export type Level = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export const LEVELS: { level: Level; name: string }[] = [
  { level: "A1", name: "Iniciante" },
  { level: "A2", name: "Básico" },
  { level: "B1", name: "Intermediário" },
  { level: "B2", name: "Intermediário avançado" },
  { level: "C1", name: "Avançado" },
  { level: "C2", name: "Proficiente" },
];

export type Streak = { current: number; longest: number; activeToday: boolean };

export type TrailStats = {
  xp: number;
  todayXp: number;
  streak: Streak;
  week: { day: string; xp: number }[];
};

export type TrailLesson = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  xp: number;
  exerciseCount: number;
  completed: boolean;
  bestScore: number | null;
  stars: 0 | 1 | 2 | 3;
};

export type TrailUnit = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  emoji: string | null;
  completedLessons: number;
  lessons: TrailLesson[];
};

export type PlacementSummary = { level: Level; score: number; createdAt: string };

export type TrailOverview = {
  stats: TrailStats;
  /** resultado mais recente do teste de nível, se houver */
  placement: PlacementSummary | null;
  next: { level: Level; unit: string; lesson: string; title: string } | null;
  levels: { level: Level; units: TrailUnit[] }[];
};

/* ---------- lição ---------- */

export type PublicExercise =
  | { key: string; type: "MULTIPLE_CHOICE"; prompt: string; choices: string[]; speak?: string }
  | { key: string; type: "FILL_BLANK"; sentence: string; choices?: string[]; translation?: string }
  | { key: string; type: "ORDER"; prompt: string; words: string[] }
  | { key: string; type: "TRANSLATION"; prompt: string; from: "pt" | "en" }
  | { key: string; type: "DICTATION"; speak: string };

/** A explicação de uma lição: `sections` antes dos exercícios, `tips` ("para fixar") depois. */
export type Study = {
  intro: string;
  /** o essencial em poucas linhas, mostrado no topo da explicação */
  summary?: string[];
  sections: {
    title: string;
    /** parágrafos separados por linha em branco; **negrito** */
    text: string;
    examples?: { en: string; pt: string }[];
    table?: { head: string[]; rows: string[][] };
    tip?: string;
    warn?: string;
  }[];
  tips: string[];
};

export type LessonData = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  xp: number;
  unit: { slug: string; title: string; emoji: string | null; level: Level };
  vocab: { front: string; back: string }[];
  study: Study | null;
  nextLesson: { slug: string; title: string } | null;
  bestScore: number | null;
  exercises: PublicExercise[];
};

export type CheckResult = {
  correct: boolean;
  typo: boolean;
  /** false quando é uma repetição (treino) e não muda a nota */
  counted: boolean;
  expected: string;
  explanation: string | null;
};

export type FinishResult = {
  score: number;
  correct: number;
  total: number;
  xp: number;
  perfect: boolean;
  stars: 0 | 1 | 2 | 3;
  firstCompletion: boolean;
  extendedToday: boolean;
  totalXp: number;
  streak: Streak;
};

/* ---------- teste de nível ---------- */

export type PlacementData = {
  questions: PublicExercise[];
  result: (PlacementSummary & { perLevel: Record<string, { correct: number; total: number }> }) | null;
};

export type PlacementOutcome = {
  level: Level;
  score: number;
  correct: number;
  total: number;
  perLevel: { level: Level; correct: number; total: number }[];
};

/** Posição do nível na escada A1…C2 (para comparar níveis). */
export const levelIndex = (level: Level) => LEVELS.findIndex((entry) => entry.level === level);
export const levelName = (level: Level) => LEVELS.find((entry) => entry.level === level)?.name ?? level;
