import type { Level } from "@/lib/trail-types";

export type Feedback = {
  provider: "claude" | "basic";
  degraded: boolean;
  grammar: {
    level: Exclude<Level, "A1"> | null;
    summary: string;
    corrections: { original: string; corrected: string; explanation: string }[];
  } | null;
  technical: { score: number; summary: string; strengths: string[]; issues: string[]; missing: string[] };
  coverage: { point: string; covered: boolean }[];
  improvedAnswer: string | null;
  tip: string;
};

export type Attempt = {
  id: string;
  createdAt: string;
  answer: string;
  seconds: number;
  provider: "claude" | "basic";
  technicalScore: number | null;
  feedback: Feedback;
};

export type QuestionSummary = {
  slug: string;
  category: string;
  difficulty: 1 | 2 | 3;
  question: string;
  attempts: number;
  bestScore: number | null;
  lastAt: string | null;
};

export type QuestionList = { aiEnabled: boolean; questions: QuestionSummary[] };

export type QuestionDetail = {
  aiEnabled: boolean;
  question: { slug: string; category: string; difficulty: 1 | 2 | 3; question: string; context: string | null; phrases: string[] };
  attempts: Attempt[];
};

export type Sample = { sampleAnswer: string; keyPoints: string[]; phrases: string[] };
