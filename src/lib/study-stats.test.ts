import { describe, expect, it } from "vitest";
import { accuracy, addAnswer, emptyStats, formatDuration, sessionProgress } from "./study-stats";

describe("study-stats", () => {
  it("soma respostas e tempo", () => {
    let stats = emptyStats();
    stats = addAnswer(stats, 3, 4000);
    stats = addAnswer(stats, 1, 6000);
    stats = addAnswer(stats, 4, -50); // tempo negativo não conta
    expect(stats).toEqual({ total: 3, byRating: { 1: 1, 2: 0, 3: 1, 4: 1 }, ms: 10000 });
  });

  it("acerto é tudo menos 'Errei'", () => {
    expect(accuracy(emptyStats())).toBe(0);
    let stats = emptyStats();
    for (const rating of [3, 3, 1, 2] as const) stats = addAnswer(stats, rating, 1000);
    expect(accuracy(stats)).toBe(75);
  });

  it("formata a duração", () => {
    expect(formatDuration(0)).toBe("0 s");
    expect(formatDuration(45_000)).toBe("45 s");
    expect(formatDuration(192_000)).toBe("3 min 12 s");
    expect(formatDuration(3_900_000)).toBe("1 h 05 min");
  });

  it("progresso: respondidos sobre o total da sessão", () => {
    expect(sessionProgress(0, { new: 5, learning: 0, review: 5 })).toBe(0);
    expect(sessionProgress(5, { new: 3, learning: 1, review: 1 })).toBe(50);
    expect(sessionProgress(8, { new: 0, learning: 0, review: 0 })).toBe(100);
    expect(sessionProgress(0, { new: 0, learning: 0, review: 0 })).toBe(100);
  });
});
