import type { Level } from "@/lib/trail-types";

export const MOODS = ["🤩", "😄", "🙂", "😐", "😟", "😴"] as const;
export type Mood = (typeof MOODS)[number];

export type DiaryFeedback = {
  provider: "claude" | "basic";
  degraded: boolean;
  level: Level | null;
  summary: string;
  corrections: { original: string; corrected: string; explanation: string }[];
  /** pontos bons (com IA) ou observações (revisão simples) */
  notes: string[];
  improvedVersion: string | null;
  tip: string;
};

export type DiaryEntry = {
  day: string;
  text: string;
  wordCount: number;
  mood: Mood | null;
  promptKey: string | null;
  updatedAt: string;
  feedback: DiaryFeedback | null;
  feedbackAt: string | null;
  /** o texto mudou depois da última correção */
  feedbackStale: boolean;
};

export type DiaryPrompt = { key: string; en: string; hint: string };

export type DiaryStats = {
  entries: number;
  words: number;
  averageWords: number;
  streak: { current: number; longest: number };
};

export type DiaryOverview = {
  today: string;
  aiEnabled: boolean;
  editableFrom: string;
  prompt: DiaryPrompt;
  entry: DiaryEntry | null;
  week: { day: string; written: boolean }[];
  stats: DiaryStats;
};

export type DiaryDay = {
  today: string;
  day: string;
  aiEnabled: boolean;
  editable: boolean;
  prompt: DiaryPrompt;
  entry: DiaryEntry | null;
};

export type DiaryListItem = { day: string; preview: string; wordCount: number; mood: Mood | null; hasFeedback: boolean };
