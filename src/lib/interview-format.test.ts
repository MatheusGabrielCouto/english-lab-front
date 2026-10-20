import { describe, expect, it } from "vitest";
import type { QuestionSummary } from "./interview-types";
import { categoryTitle, filterQuestions, formatSeconds, highlightCorrections, parseCategory, parseDifficulty, progressByCategory, scoreLabel, wordCount } from "./interview-format";

const q = (slug: string, category: string, difficulty: 1 | 2 | 3, attempts = 0): QuestionSummary => ({
  slug, category, difficulty, question: slug, attempts, bestScore: attempts ? 3 : null, lastAt: null,
});

describe("categorias e filtros", () => {
  it("título conhecido ou o próprio slug; query inválida vira null", () => {
    expect(categoryTitle("react")).toBe("React");
    expect(categoryTitle("outra")).toBe("outra");
    expect(parseCategory("react")).toBe("react");
    expect(parseCategory("nope")).toBeNull();
    expect(parseCategory(["react"])).toBeNull();
    expect(parseCategory(undefined)).toBeNull();
    expect(parseDifficulty("2")).toBe(2);
    expect(parseDifficulty("9")).toBeNull();
  });

  it("filtra por categoria e dificuldade", () => {
    const list = [q("a", "react", 1), q("b", "react", 3), q("c", "backend", 3)];
    expect(filterQuestions(list, null, null)).toHaveLength(3);
    expect(filterQuestions(list, "react", null).map((e) => e.slug)).toEqual(["a", "b"]);
    expect(filterQuestions(list, null, 3).map((e) => e.slug)).toEqual(["b", "c"]);
    expect(filterQuestions(list, "react", 3).map((e) => e.slug)).toEqual(["b"]);
  });

  it("progresso por categoria conta as respondidas", () => {
    const result = progressByCategory([q("a", "react", 1, 2), q("b", "react", 2), q("c", "backend", 1, 1)]);
    expect(result.get("react")).toEqual({ answered: 1, total: 2 });
    expect(result.get("backend")).toEqual({ answered: 1, total: 1 });
  });
});

describe("scoreLabel", () => {
  it("1 a 5, com limites", () => {
    expect(scoreLabel(1)).toContain("bastante");
    expect(scoreLabel(5)).toBe("Excelente");
    expect(scoreLabel(9)).toBe("Excelente");
    expect(scoreLabel(0)).toContain("bastante");
    expect(scoreLabel(3.6)).toBe("Muito boa");
  });
});

describe("highlightCorrections", () => {
  const correction = (original: string) => ({ original, corrected: `${original}!`, explanation: "x" });

  it("marca os trechos com erro e mantém o resto do texto", () => {
    const segments = highlightCorrections("He go to work and she have a car.", [correction("He go"), correction("she have")]);
    expect(segments.map((segment) => segment.text)).toEqual(["He go", " to work and ", "she have", " a car."]);
    expect(segments.map((segment) => segment.correction !== null)).toEqual([true, false, true, false]);
  });

  it("ordena pela posição, ignora o que não aparece e o que se sobrepõe", () => {
    const segments = highlightCorrections("I am agree with you", [correction("agree with"), correction("not here"), correction("am agree")]);
    // "am agree" e "agree with" se sobrepõem: vale o primeiro da lista
    expect(segments.filter((segment) => segment.correction).map((segment) => segment.text)).toEqual(["agree with"]);
    expect(segments.map((segment) => segment.text).join("")).toBe("I am agree with you");
  });

  it("sem correções devolve o texto inteiro", () => {
    expect(highlightCorrections("Hello", [])).toEqual([{ text: "Hello", correction: null }]);
    expect(highlightCorrections("", [])).toEqual([{ text: "", correction: null }]);
  });
});

describe("contagem e tempo", () => {
  it("palavras e segundos", () => {
    expect(wordCount("  one  two\nthree ")).toBe(3);
    expect(wordCount("")).toBe(0);
    expect(formatSeconds(45)).toBe("45 s");
    expect(formatSeconds(60)).toBe("1 min");
    expect(formatSeconds(200)).toBe("3 min 20 s");
  });
});
