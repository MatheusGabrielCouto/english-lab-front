import { describe, expect, it } from "vitest";
import { formatDiaryDay, formatMonthKey, isDayKey, lengthHint, monthGrid, monthOf, saveStatus, shiftMonth } from "./diary-format";

describe("datas", () => {
  it("escreve o dia e o mês em português", () => {
    expect(formatDiaryDay("2026-10-20")).toBe("Terça-feira, 20 de outubro");
    expect(formatMonthKey("2026-10")).toBe("Outubro de 2026");
    expect(monthOf("2026-10-20")).toBe("2026-10");
  });

  it("shiftMonth atravessa o ano nos dois sentidos", () => {
    expect(shiftMonth("2026-10", 1)).toBe("2026-11");
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(shiftMonth("2026-10", 0)).toBe("2026-10");
  });

  it("isDayKey aceita só datas reais no formato AAAA-MM-DD", () => {
    expect(isDayKey("2026-10-20")).toBe(true);
    expect(isDayKey("2026-13-45")).toBe(false);
    expect(isDayKey("20-10-2026")).toBe(false);
    expect(isDayKey("hoje")).toBe(false);
  });
});

describe("monthGrid", () => {
  it("outubro de 2026 começa na quinta e termina no sábado, em linhas de 7", () => {
    const rows = monthGrid("2026-10");
    expect(rows.every((row) => row.length === 7)).toBe(true);
    expect(rows[0].slice(0, 4)).toEqual([null, null, null, null]);
    expect(rows[0][4]).toBe("2026-10-01");
    expect(rows.at(-1)?.at(-1)).toBe("2026-10-31");
    expect(rows.flat().filter(Boolean)).toHaveLength(31);
  });

  it("fevereiro bissexto tem 29 dias", () => {
    expect(monthGrid("2028-02").flat().filter(Boolean)).toHaveLength(29);
  });
});

describe("lengthHint", () => {
  it("muda conforme o texto cresce", () => {
    expect(lengthHint(0)).toContain("50 a 150");
    expect(lengthHint(10)).toContain("20 palavras");
    expect(lengthHint(30)).toContain("Faltam 20");
    expect(lengthHint(100)).toContain("ideal");
    expect(lengthHint(300)).toContain("longo");
  });
});

describe("saveStatus", () => {
  it("prioriza salvando, depois alterações pendentes, depois o horário", () => {
    expect(saveStatus({ dirty: true, saving: true, savedAt: null })).toBe("Salvando…");
    expect(saveStatus({ dirty: true, saving: false, savedAt: new Date() })).toBe("Alterações ainda não salvas");
    expect(saveStatus({ dirty: false, saving: false, savedAt: new Date(2026, 9, 20, 9, 5) })).toBe("Salvo às 09:05");
    expect(saveStatus({ dirty: false, saving: false, savedAt: null })).toBe("");
  });
});
