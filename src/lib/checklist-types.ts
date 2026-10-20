export type ChecklistItem = {
  key: string;
  kind: "SYSTEM" | "CUSTOM";
  label: string;
  href: string | null;
  enabled: boolean;
  done: boolean;
  /** de onde veio o "feito": a plataforma (auto) ou o aluno (manual) */
  source: "auto" | "manual" | null;
  /** tem uma marcação do aluno (dá para desmarcar) */
  checked: boolean;
  progress: { current: number; target: number; unit: "lições" | "revisões" | "min" | "palavras" | "respostas" } | null;
  askMinutes: boolean;
  defaultMinutes: number;
  minutes: number | null;
};

export type DayState = { day: string; done: number; total: number; percent: number; complete: boolean };

export type ChecklistToday = {
  day: string;
  items: ChecklistItem[];
  summary: DayState;
  streak: { current: number; longest: number };
  /** últimos 14 dias, do mais antigo ao de hoje */
  strip: DayState[];
  /** últimos 120 dias (alimenta o calendário) */
  history: DayState[];
};
