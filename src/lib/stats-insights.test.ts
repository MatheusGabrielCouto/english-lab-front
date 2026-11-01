import { describe, expect, it } from "vitest";
import {
  activityLevel,
  answerRows,
  answerTip,
  busiestForecastDay,
  dayPart,
  daysLabel,
  daysToFinishNew,
  hourRange,
  peakIndex,
  percentOf,
  retentionLevel,
} from "./stats-insights";

describe("retentionLevel", () => {
  it("traduz a taxa em um nível e uma frase", () => {
    expect(retentionLevel(null).tone).toBe("neutral");
    expect(retentionLevel(0.93)).toMatchObject({ tone: "good", label: "Ótimo" });
    expect(retentionLevel(0.85)).toMatchObject({ tone: "ok", label: "Bom" });
    expect(retentionLevel(0.6)).toMatchObject({ tone: "warn", label: "Atenção" });
    expect(retentionLevel(0.9).text).toContain("90 em cada 100");
  });
});

describe("answerRows / answerTip", () => {
  it("calcula a porcentagem de cada botão", () => {
    const rows = answerRows({ again: 1, hard: 1, good: 6, easy: 2 });
    expect(rows.map((row) => row.percent)).toEqual([10, 10, 60, 20]);
    expect(answerRows({ again: 0, hard: 0, good: 0, easy: 0 }).every((row) => row.percent === 0)).toBe(true);
  });

  it("só dá dica com respostas suficientes", () => {
    expect(answerTip({ again: 5, hard: 0, good: 0, easy: 0 })).toBeNull();
    expect(answerTip({ again: 10, hard: 0, good: 10, easy: 0 })).toContain("errou bastante");
    expect(answerTip({ again: 0, hard: 0, good: 5, easy: 25 })).toContain("fácil");
    expect(answerTip({ again: 2, hard: 3, good: 20, easy: 5 })).toContain("equilíbrio");
  });
});

describe("ritmo e horários", () => {
  it("acha o pico e ignora tudo zerado", () => {
    expect(peakIndex([0, 0, 0])).toBe(-1);
    expect(peakIndex([1, 5, 3])).toBe(1);
  });

  it("descreve horas e partes do dia", () => {
    expect(hourRange(20)).toBe("20h às 21h");
    expect(hourRange(23)).toBe("23h às 0h");
    expect([2, 9, 15, 21].map(dayPart)).toEqual(["madrugada", "manhã", "tarde", "noite"]);
  });

  it("estima quando acabam os cartões novos", () => {
    expect(daysToFinishNew(100, 10)).toBe(10);
    expect(daysToFinishNew(101, 10)).toBe(11);
    expect(daysToFinishNew(0, 10)).toBeNull();
    expect(daysToFinishNew(50, 0)).toBeNull();
    expect(daysLabel(1)).toBe("1 dia");
    expect(daysLabel(20)).toBe("20 dias");
    expect(daysLabel(150)).toBe("5 meses");
    expect(daysLabel(900)).toBe("2,5 anos");
  });
});

describe("previsão e calendário", () => {
  it("encontra o dia mais cheio", () => {
    expect(busiestForecastDay([{ date: "a", due: 0 }])).toBeNull();
    expect(
      busiestForecastDay([
        { date: "a", due: 2 },
        { date: "b", due: 9 },
        { date: "c", due: 9 },
      ]),
    ).toEqual({ index: 1, due: 9 });
  });

  it("gradua a cor do calendário em 5 níveis", () => {
    expect([0, 1, 30, 60, 100].map((n) => activityLevel(n, 100))).toEqual([0, 1, 2, 3, 4]);
    expect(activityLevel(5, 0)).toBe(0);
  });

  it("calcula porcentagem sem dividir por zero", () => {
    expect(percentOf(1, 3)).toBe(33);
    expect(percentOf(1, 0)).toBe(0);
  });
});
