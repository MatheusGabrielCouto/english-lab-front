import { describe, expect, it } from "vitest";
import type { ChecklistItem, DayState } from "./checklist-types";
import { completeDaysInMonth, dayMessage, formatLongDay, formatMonth, itemDetail, monthCalendar } from "./checklist-format";

const item = (overrides: Partial<ChecklistItem>): ChecklistItem => ({
  key: "anki", kind: "SYSTEM", label: "Revisar o Anki", href: "/anki", enabled: true, done: false, source: null, checked: false,
  progress: { current: 3, target: 5, unit: "revisões" }, askMinutes: false, defaultMinutes: 0, minutes: null, ...overrides,
});

const state = (day: string, done: number, total = 7): DayState => ({ day, done, total, percent: Math.round((done / total) * 100), complete: done === total });

describe("formatação de datas", () => {
  it("dia por extenso e mês, em português e sem sofrer com fuso", () => {
    expect(formatLongDay("2026-10-20")).toBe("Terça-feira, 20 de outubro");
    expect(formatMonth("2026-10-20")).toBe("Outubro de 2026");
  });
});

describe("itemDetail", () => {
  it("progresso, feito pela plataforma, marcado à mão (com e sem minutos) e sem detalhe", () => {
    expect(itemDetail(item({}))).toBe("3 de 5 revisões");
    expect(itemDetail(item({ done: true, source: "auto", progress: { current: 7, target: 5, unit: "revisões" } }))).toBe("Feito: 7 revisões");
    expect(itemDetail(item({ done: true, source: "manual", checked: true, minutes: 20 }))).toBe("Marcado por você · 20 min");
    expect(itemDetail(item({ done: true, source: "manual", checked: true }))).toBe("Marcado por você");
    expect(itemDetail(item({ progress: null }))).toBeNull();
  });
});

describe("monthCalendar", () => {
  it("outubro de 2026 começa numa quinta: 4 células vazias antes do dia 1 e linhas de 7", () => {
    const rows = monthCalendar("2026-10-20", []);
    expect(rows.every((row) => row.length === 7)).toBe(true);
    expect(rows[0].slice(0, 4).every((cell) => cell.day === null)).toBe(true);
    expect(rows[0][4].day).toBe("2026-10-01");
    expect(rows.flat().filter((cell) => cell.day).length).toBe(31);
    expect(rows.at(-1)!.at(-1)?.day).toBe("2026-10-31"); // sábado: a última linha fecha sem células vazias
  });

  it("liga cada dia ao seu estado do histórico", () => {
    const rows = monthCalendar("2026-10-20", [state("2026-10-19", 7), state("2026-10-20", 3)]);
    const cells = rows.flat();
    expect(cells.find((cell) => cell.day === "2026-10-19")?.state?.complete).toBe(true);
    expect(cells.find((cell) => cell.day === "2026-10-20")?.state?.done).toBe(3);
    expect(cells.find((cell) => cell.day === "2026-10-05")?.state).toBeNull();
  });

  it("mês que termina num sábado não ganha linha extra; fevereiro de 2026 cabe em 4 linhas", () => {
    const feb = monthCalendar("2026-02-10", []);
    expect(feb).toHaveLength(4);
    expect(feb[0][0].day).toBe("2026-02-01");
  });
});

describe("completeDaysInMonth", () => {
  it("conta só os dias completos do mês de hoje, até hoje", () => {
    const history = [state("2026-09-30", 7), state("2026-10-01", 7), state("2026-10-02", 6), state("2026-10-03", 7), state("2026-10-21", 7)];
    expect(completeDaysInMonth("2026-10-20", history)).toBe(2);
  });
});

describe("dayMessage", () => {
  it("cobre sem itens, começando, no meio, quase lá e completo", () => {
    expect(dayMessage(0, 0, false)).toContain("Personalizar");
    expect(dayMessage(0, 7, false)).toContain("Comece");
    expect(dayMessage(3, 7, false)).toBe("Faltam 4 itens para fechar o dia.");
    expect(dayMessage(6, 7, false)).toBe("Falta só um item para fechar o dia.");
    expect(dayMessage(7, 7, true)).toContain("completo");
  });
});
