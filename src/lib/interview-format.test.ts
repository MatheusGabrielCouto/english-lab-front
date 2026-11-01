import { describe, expect, it } from "vitest";
import type { QuestionSummary } from "./interview-types";
import {
  categoryTitle,
  filterQuestions,
  formatSeconds,
  highlightCorrections,
  nextAfter,
  overview,
  parseCategory,
  parseDifficulty,
  parseStatus,
  pickRandom,
  progressByCategory,
  questionStatus,
  scoreLabel,
  searchQuestions,
  suggestQuestion,
  summarizeMock,
  wordCount,
} from "./interview-format";

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


const s = (slug: string, category: string, difficulty: 1 | 2 | 3, attempts: number, bestScore: number | null, text = slug): QuestionSummary => ({
  slug, category, difficulty, question: text, attempts, bestScore, lastAt: null,
});

describe("situação das perguntas", () => {
  it("classifica pela melhor nota", () => {
    expect(questionStatus({ attempts: 0, bestScore: null })).toBe("new");
    expect(questionStatus({ attempts: 2, bestScore: 2 })).toBe("review");
    expect(questionStatus({ attempts: 1, bestScore: 3 })).toBe("learning");
    expect(questionStatus({ attempts: 1, bestScore: 5 })).toBe("mastered");
    expect(parseStatus("review")).toBe("review");
    expect(parseStatus("qualquer")).toBeNull();
  });

  it("resume o progresso", () => {
    const list = [s("a", "react", 1, 0, null), s("b", "react", 1, 2, 5), s("c", "react", 2, 1, 2), s("d", "react", 2, 1, 4)];
    expect(overview(list)).toEqual({ total: 4, answered: 3, mastered: 2, toReview: 1, average: 3.7, attempts: 4 });
    expect(overview([]).average).toBeNull();
  });
});

describe("busca", () => {
  it("ignora acentos e maiúsculas e exige todas as palavras", () => {
    const list = [s("a", "javascript", 1, 0, null, "What is a Closure?"), s("b", "behavioral", 1, 0, null, "Tell me about yourself")];
    expect(searchQuestions(list, "CLOSURE").map((e) => e.slug)).toEqual(["a"]);
    expect(searchQuestions(list, "comportamental yourself").map((e) => e.slug)).toEqual(["b"]);
    expect(searchQuestions(list, "closure yourself")).toEqual([]);
    expect(searchQuestions(list, "  ")).toHaveLength(2);
  });
});

describe("o que praticar em seguida", () => {
  const list = [s("novo-dificil", "react", 3, 0, null), s("novo-facil", "react", 1, 0, null), s("ruim", "backend", 2, 1, 1), s("mediano", "backend", 2, 1, 3)];

  it("revisão primeiro, depois a nova mais fácil, depois as em progresso", () => {
    expect(suggestQuestion(list)?.slug).toBe("ruim");
    expect(suggestQuestion(list.filter((e) => e.slug !== "ruim"))?.slug).toBe("novo-facil");
    expect(suggestQuestion([s("mediano", "backend", 2, 1, 3)])?.slug).toBe("mediano");
    expect(suggestQuestion([s("ok", "backend", 2, 1, 5)])).toBeNull();
  });

  it("depois de responder, vai para uma nova da mesma categoria", () => {
    expect(nextAfter(list, "novo-dificil")?.slug).toBe("novo-facil");
    expect(nextAfter(list, "ruim")?.slug).toBe("novo-dificil");
    expect(nextAfter([s("a", "x", 1, 1, 5)], "a")).toBeNull();
  });
});

describe("simulado", () => {
  it("sorteia sem repetir e sem passar do que existe", () => {
    const items = [1, 2, 3, 4, 5, 6];
    const picked = pickRandom(items, 4, () => 0.3);
    expect(new Set(picked).size).toBe(4);
    expect(pickRandom(items, 10)).toHaveLength(6);
    expect(items).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("calcula a média e o tempo", () => {
    expect(summarizeMock([{ score: 4, seconds: 60 }, { score: 3, seconds: 90 }, { score: null, seconds: 10 }])).toEqual({ average: 3.5, seconds: 160, answered: 3 });
    expect(summarizeMock([]).average).toBeNull();
  });
});
