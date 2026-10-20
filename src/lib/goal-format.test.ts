import { describe, expect, it } from "vitest";
import type { GoalPlan } from "./goal-types";
import { addDays, addMonths, daysBetween, formatDay, formatMinutes, formatShortDay, hoursBetween, statusMessage, todayMessage } from "./goal-format";

const HOURS = { A1: 90, A2: 200, B1: 375, B2: 550, C1: 750, C2: 1050 } as const;

describe("formatMinutes", () => {
  it("minutos, horas exatas e horas com minutos", () => {
    expect(formatMinutes(0)).toBe("0 min");
    expect(formatMinutes(45)).toBe("45 min");
    expect(formatMinutes(59.6)).toBe("1 h");
    expect(formatMinutes(120)).toBe("2 h");
    expect(formatMinutes(150)).toBe("2 h 30 min");
    expect(formatMinutes(-5)).toBe("0 min");
  });
});

describe("datas", () => {
  it("formata em português sem sofrer com fuso", () => {
    expect(formatDay("2027-03-12")).toBe("12 de março de 2027");
    expect(formatShortDay("2027-03-12")).toMatch(/^12 de mar/);
  });

  it("soma dias e meses, respeitando o fim do mês", () => {
    expect(addDays("2026-12-30", 3)).toBe("2027-01-02");
    expect(addMonths("2026-01-15", 6)).toBe("2026-07-15");
    expect(addMonths("2026-03-31", 1)).toBe("2026-04-30");
    expect(addMonths("2026-08-31", 6)).toBe("2027-02-28");
    expect(addMonths("2026-11-10", 3)).toBe("2027-02-10");
  });

  it("dias entre datas", () => {
    expect(daysBetween("2026-02-27", "2026-03-02")).toBe(3);
    expect(daysBetween("2026-03-02", "2026-02-27")).toBe(-3);
  });
});

describe("hoursBetween", () => {
  it("usa a tabela do servidor", () => {
    expect(hoursBetween(HOURS, "A1", "B2")).toBe(550);
    expect(hoursBetween(HOURS, "B1", "B2")).toBe(350);
    expect(hoursBetween(HOURS, "B2", "A2")).toBe(0);
  });
});

const plan = (overrides: Partial<GoalPlan>): GoalPlan => ({
  requiredHours: 100, requiredMinutes: 6000, studiedMinutes: 3000, percent: 50, daysTotal: 100, daysElapsed: 50, daysLeft: 50, timePercent: 50,
  minutesLeft: 3000, dailyTargetMinutes: 60, todayMinutes: 0, todayLeftMinutes: 60, weeklyTargetMinutes: 420, status: "on-track", projectedDay: null,
  recentAverage: 0, recent: [], studyStreak: 0, activeDays: 0, bySource: { lesson: 0, anki: 0, reading: 0, interview: 0, diary: 0, checklist: 0, manual: 0 }, ...overrides,
});

describe("statusMessage", () => {
  it("cada situação tem uma frase própria", () => {
    expect(statusMessage(plan({ status: "on-track" }))).toContain("1 h por dia");
    expect(statusMessage(plan({ status: "ahead", percent: 60, timePercent: 40 }))).toContain("60%");
    expect(statusMessage(plan({ status: "done" }))).toContain("todas as horas");
    expect(statusMessage(plan({ status: "overdue" }))).toContain("passou");
  });

  it("atrasado: mostra a projeção quando há ritmo recente, senão a meta diária", () => {
    const withPace = statusMessage(plan({ status: "behind", recentAverage: 30, projectedDay: "2027-05-15" }));
    expect(withPace).toContain("30 min por dia");
    expect(withPace).toContain("15 de maio de 2027");
    expect(statusMessage(plan({ status: "behind" }))).toContain("1 h por dia");
  });
});

describe("todayMessage", () => {
  it("meta cumprida, começando e em andamento", () => {
    expect(todayMessage(plan({ todayLeftMinutes: 0, todayMinutes: 70 }))).toContain("cumprida");
    expect(todayMessage(plan({ todayMinutes: 0, todayLeftMinutes: 60 }))).toContain("Comece");
    expect(todayMessage(plan({ todayMinutes: 20, todayLeftMinutes: 40 }))).toContain("40 min");
    expect(todayMessage(plan({ status: "done" }))).toContain("concluída");
  });
});
