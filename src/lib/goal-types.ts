import type { Level } from "@/lib/trail-types";

export type GoalStatus = "done" | "overdue" | "ahead" | "on-track" | "behind";

export type Goal = {
  startLevel: Level;
  targetLevel: Level;
  startDay: string;
  targetDay: string;
  motivation: string | null;
};

export type GoalPlan = {
  requiredHours: number;
  requiredMinutes: number;
  studiedMinutes: number;
  percent: number;
  daysTotal: number;
  daysElapsed: number;
  daysLeft: number;
  timePercent: number;
  minutesLeft: number;
  dailyTargetMinutes: number;
  todayMinutes: number;
  todayLeftMinutes: number;
  weeklyTargetMinutes: number;
  status: GoalStatus;
  projectedDay: string | null;
  recentAverage: number;
  recent: { day: string; minutes: number }[];
  studyStreak: number;
  activeDays: number;
  bySource: { lesson: number; anki: number; reading: number; interview: number; diary: number; checklist: number; manual: number };
};

export type GoalOverview = {
  goal: Goal | null;
  plan: GoalPlan | null;
  suggestedStartLevel: Level;
  /** o dia de estudo de hoje (YYYY-MM-DD) */
  today: string;
  /** horas acumuladas para ALCANÇAR cada nível, partindo do zero */
  cumulativeHours: Record<Level, number>;
};

export type GoalPreview = {
  startLevel: Level;
  requiredHours: number;
  daysTotal: number;
  perDayMinutes: number;
  perWeekMinutes: number;
};
