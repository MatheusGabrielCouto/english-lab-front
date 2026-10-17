import type { DeckCounts, Rating } from "@/lib/anki-types";

export type SessionStats = {
  total: number;
  byRating: Record<Rating, number>;
  /** tempo olhando os cartões, em ms */
  ms: number;
};

export const emptyStats = (): SessionStats => ({ total: 0, byRating: { 1: 0, 2: 0, 3: 0, 4: 0 }, ms: 0 });

export function addAnswer(stats: SessionStats, rating: Rating, ms: number): SessionStats {
  return {
    total: stats.total + 1,
    byRating: { ...stats.byRating, [rating]: stats.byRating[rating] + 1 },
    ms: stats.ms + Math.max(0, ms),
  };
}

/** % de cartões em que você não errou ("Errei" = 1). Sem respostas, 0. */
export function accuracy(stats: SessionStats): number {
  if (stats.total === 0) return 0;
  return Math.round(((stats.total - stats.byRating[1]) / stats.total) * 100);
}

/** "45 s", "3 min 12 s", "1 h 05 min". */
export function formatDuration(ms: number): string {
  const seconds = Math.max(0, Math.round(ms / 1000));
  if (seconds < 60) return `${seconds} s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ${String(seconds % 60).padStart(2, "0")} s`;
  return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, "0")} min`;
}

/** Quanto da sessão já passou: respondidos ÷ (respondidos + o que ainda falta hoje). 0 a 100. */
export function sessionProgress(answered: number, counts: DeckCounts): number {
  const remaining = counts.new + counts.learning + counts.review;
  const total = answered + remaining;
  return total === 0 ? 100 : Math.round((answered / total) * 100);
}
