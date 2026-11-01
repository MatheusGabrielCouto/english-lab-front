import { describe, expect, it } from "vitest";
import { answersText, focusRemaining, missesText, missingInText, percentText, weakestRow } from "@/lib/tense-format";
import type { TenseRow } from "@/lib/tense-types";

const counts = { passado: 2, presente: 0, futuro: 1, perfeito: 0 };
const focus = { tense: "passado" as const, title: "", task: "", starters: [], goal: 3 };

describe("percentText / answersText / missesText", () => {
  it("formata", () => {
    expect(percentText(null)).toBe("–");
    expect(percentText(67)).toBe("67%");
    expect(answersText(1)).toBe("1 resposta");
    expect(answersText(12)).toBe("12 respostas");
    expect(missesText(3, 4)).toBe("errou 3 de 4 vezes");
    expect(missesText(1, 1)).toBe("errou na única vez");
  });
});

describe("diário", () => {
  it("diz quais dos três tempos faltam no texto", () => {
    expect(missingInText(counts)).toEqual(["presente"]);
    expect(missingInText(null)).toEqual(["passado", "presente", "futuro"]);
  });

  it("calcula quantas frases faltam no tempo do dia", () => {
    expect(focusRemaining(focus, counts)).toBe(1);
    expect(focusRemaining(focus, null)).toBe(3);
    expect(focusRemaining(focus, { ...counts, passado: 5 })).toBe(0);
  });
});

describe("weakestRow", () => {
  const row = (tense: TenseRow["tense"], accuracy: number | null, level: TenseRow["level"]): TenseRow => ({
    tense,
    label: tense,
    cards: 0,
    anki: { answers: 0, correct: 0, accuracy: null },
    trail: { answers: 0, correct: 0, accuracy: null },
    answers: 20,
    correct: 0,
    accuracy,
    level,
  });

  it("escolhe a de menor acerto entre as fracas", () => {
    expect(weakestRow([row("passado", 60, "weak"), row("futuro", 40, "weak"), row("presente", 95, "strong")])?.tense).toBe("futuro");
  });

  it("devolve null quando ninguém está fraco", () => {
    expect(weakestRow([row("passado", 90, "strong"), row("presente", null, "none")])).toBeNull();
  });
});
