import { describe, expect, it } from "vitest";
import type { LookupResult } from "./dictionary-types";
import { buildNote, canBuild, coversWord, meaningOf, type WordCardInput } from "./word-cards";

const lookup = (overrides: Partial<LookupResult> = {}): LookupResult => ({
  text: "borrow",
  kind: "word",
  phonetic: "/ˈbɒɹəʊ/",
  meanings: [{ partOfSpeech: "verb", definitions: [{ definition: "To take something temporarily." }] }],
  lemma: null,
  translation: { text: "pegar emprestado", note: "Verbo regular.", definition: "To take temporarily, in this sentence.", provider: "claude" },
  status: { dictionary: "ok", translation: "ok" },
  ...overrides,
});

const base: WordCardInput = {
  kind: "word",
  text: "borrow",
  sentence: { sentence: "Can I borrow your pen?", wordIndex: 6 },
  lookup: lookup(),
  book: { title: "The Quiet Morning", level: "A2" },
  page: 12,
};

describe("buildNote — cartão de palavra", () => {
  it("frente = palavra, verso = tradução, dica com sentido, frase e origem", () => {
    expect(buildNote(base)).toEqual({
      type: "BASIC",
      front: "borrow",
      back: "pegar emprestado",
      extra: ["To take temporarily, in this sentence.", "Verbo regular.", "“Can I borrow your pen?”", "📖 The Quiet Morning · p. 12"].join("\n"),
      tags: ["livro", "a2"],
    });
  });

  it("sem tradução, usa a definição como verso", () => {
    const note = buildNote({ ...base, lookup: lookup({ translation: null }) });
    expect(note).toMatchObject({ type: "BASIC", back: "To take something temporarily." });
    expect((note as { extra: string }).extra).not.toContain("To take something temporarily.\nTo take"); // não repete
  });

  it("não repete a definição quando ela já é o verso", () => {
    const note = buildNote({ ...base, lookup: lookup({ translation: null }) });
    const extra = (note as { extra: string }).extra.split("\n");
    expect(extra.filter((line) => line === "To take something temporarily.")).toHaveLength(0);
  });

  it("palavra flexionada cita a forma base", () => {
    const note = buildNote({
      ...base,
      text: "went",
      lookup: lookup({ lemma: { word: "go", meanings: [{ partOfSpeech: "verb", definitions: [{ definition: "To move." }] }] } }),
    });
    expect((note as { extra: string }).extra).toContain("forma de “go”");
  });

  it("sem frase, a dica não tem citação", () => {
    const note = buildNote({ ...base, sentence: undefined });
    expect((note as { extra: string }).extra).not.toContain("“");
  });

  it("sem nada para o verso, recusa", () => {
    expect(() => buildNote({ ...base, lookup: lookup({ translation: null, meanings: [] }) })).toThrow();
    expect(canBuild({ ...base, lookup: lookup({ translation: null, meanings: [] }) })).toBe(false);
    expect(canBuild({ ...base, lookup: null })).toBe(false);
  });
});

describe("buildNote — cartão com lacuna", () => {
  const cloze: WordCardInput = { ...base, kind: "cloze" };

  it("esconde a palavra tocada dentro da frase", () => {
    const note = buildNote(cloze);
    expect(note).toMatchObject({ type: "CLOZE", text: "Can I {{c1::borrow}} your pen?" });
    expect((note as { extra: string }).extra).toBe(
      ["pegar emprestado", "Verbo regular.", "To take temporarily, in this sentence.", "📖 The Quiet Morning · p. 12"].join("\n"),
    );
  });

  it("esconde a ocorrência tocada quando a palavra se repete", () => {
    const note = buildNote({
      ...cloze,
      text: "cat",
      sentence: { sentence: "The cat saw the cat.", wordIndex: 16 },
    });
    expect((note as { text: string }).text).toBe("The cat saw the {{c1::cat}}.");
  });

  it("mantém a caixa original da palavra na frase", () => {
    const note = buildNote({ ...cloze, text: "can", sentence: { sentence: "Can I borrow it?", wordIndex: 0 } });
    expect((note as { text: string }).text).toBe("{{c1::Can}} I borrow it?");
  });

  it("se o índice não bate, acha a primeira ocorrência", () => {
    const note = buildNote({ ...cloze, sentence: { sentence: "Can I borrow your pen?", wordIndex: 0 } });
    expect((note as { text: string }).text).toBe("Can I {{c1::borrow}} your pen?");
  });

  it("sem frase ou com a palavra fora dela, não dá para criar", () => {
    expect(canBuild({ ...cloze, sentence: undefined })).toBe(false);
    expect(canBuild({ ...cloze, text: "banana" })).toBe(false);
    expect(() => buildNote({ ...cloze, sentence: undefined })).toThrow();
  });

  it("expressões também funcionam", () => {
    const note = buildNote({
      ...cloze,
      text: "look forward to",
      sentence: { sentence: "I look forward to meeting you.", wordIndex: 2 },
    });
    expect((note as { text: string }).text).toBe("I {{c1::look forward to}} meeting you.");
  });
});

describe("limites", () => {
  it("corta campos acima de 2000 caracteres", () => {
    const note = buildNote({ ...base, lookup: lookup({ translation: { text: "x".repeat(3000), provider: "mymemory" } }) });
    expect((note as { back: string }).back.length).toBeLessThanOrEqual(2000);
  });

  it("meaningOf prefere o sentido da frase, depois a forma base, depois o próprio verbete", () => {
    expect(meaningOf(lookup())).toBe("To take temporarily, in this sentence.");
    expect(meaningOf(lookup({ translation: null }))).toBe("To take something temporarily.");
    expect(
      meaningOf(lookup({ translation: null, lemma: { word: "go", meanings: [{ partOfSpeech: "verb", definitions: [{ definition: "To move." }] }] } })),
    ).toBe("To move.");
    expect(meaningOf(null)).toBe("");
  });
});

describe("coversWord", () => {
  it("reconhece cartão de palavra (frente) e de lacuna sobre a palavra", () => {
    expect(coversWord({ front: "Borrow", back: "pegar emprestado" }, "borrow")).toBe(true);
    expect(coversWord({ text: "Can I {{c1::borrow}} your pen?" }, "Borrow")).toBe(true);
    expect(coversWord({ text: "Can I {{c1::borrow::verbo}} your pen?" }, "borrow")).toBe(true);
  });

  it("não confunde com cartões que só citam a palavra na frase", () => {
    expect(coversWord({ text: "The {{c1::baker}} smelled fresh bread." }, "bread")).toBe(false);
    expect(coversWord({ front: "bread and butter", back: "x" }, "bread")).toBe(false);
    expect(coversWord({ front: "borrowed", back: "x", extra: "borrow" }, "borrow")).toBe(false);
    expect(coversWord({}, "")).toBe(false);
  });
});
