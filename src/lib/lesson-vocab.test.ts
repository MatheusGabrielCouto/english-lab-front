import { describe, expect, it } from "vitest";
import { vocabDeckPath, vocabNotes } from "./lesson-vocab";

const lesson = {
  title: "Olá e tchau",
  unit: { slug: "greetings", title: "Cumprimentos", emoji: "👋", level: "A1" as const },
  vocab: [
    { front: "hello", back: "olá" },
    { front: "goodbye", back: "tchau, adeus" },
  ],
};

describe("lesson-vocab", () => {
  it("baralho: Trilha › nível › unidade", () => {
    expect(vocabDeckPath(lesson)).toEqual(["Trilha", "A1", "Cumprimentos"]);
  });

  it("'::' no título não vira subbaralho extra", () => {
    expect(vocabDeckPath({ unit: { ...lesson.unit, title: "A::B" } })).toEqual(["Trilha", "A1", "A-B"]);
  });

  it("um cartão básico por palavra, com a origem e as tags", () => {
    expect(vocabNotes(lesson)).toEqual([
      { type: "BASIC", front: "hello", back: "olá", extra: "📘 Cumprimentos › Olá e tchau", tags: ["trilha", "a1"] },
      { type: "BASIC", front: "goodbye", back: "tchau, adeus", extra: "📘 Cumprimentos › Olá e tchau", tags: ["trilha", "a1"] },
    ]);
  });

  it("sem vocabulário, sem cartões", () => {
    expect(vocabNotes({ ...lesson, vocab: [] })).toEqual([]);
  });
});
