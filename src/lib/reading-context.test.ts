import { describe, expect, it } from "vitest";
import { joinLines, normalizeSelection, sentenceAround, wordAt } from "./reading-context";

const text = "It was a quiet morning. The baker opened his shop early, as he always did. 'Why did he go?' Anna asked.";

describe("wordAt", () => {
  it("acha a palavra no meio, no começo e no fim", () => {
    expect(wordAt(text, text.indexOf("quiet") + 2)?.word).toBe("quiet");
    expect(wordAt(text, text.indexOf("quiet"))?.word).toBe("quiet");
    expect(wordAt(text, text.indexOf("quiet") + 5)?.word).toBe("quiet");
  });

  it("devolve as posições da palavra", () => {
    const match = wordAt(text, text.indexOf("baker") + 1)!;
    expect(text.slice(match.start, match.end)).toBe("baker");
  });

  it("entende apóstrofo e hífen como parte da palavra", () => {
    expect(wordAt("I don't know", 4)?.word).toBe("don't");
    expect(wordAt("I don’t know", 4)?.word).toBe("don’t");
    expect(wordAt("a well-known author", 4)?.word).toBe("well-known");
  });

  it("não tira palavra de pontuação, número ou espaço no vazio", () => {
    expect(wordAt("...", 1)).toBeNull();
    expect(wordAt("12345", 2)).toBeNull();
    expect(wordAt("", 0)).toBeNull();
  });

  it("funciona com letras acentuadas", () => {
    expect(wordAt("um café quente", 5)?.word).toBe("café");
  });
});

describe("sentenceAround", () => {
  const at = (word: string, source = text) => {
    const start = source.indexOf(word);
    return sentenceAround(source, start, start + word.length);
  };

  it("devolve só a frase da palavra", () => {
    expect(at("baker").sentence).toBe("The baker opened his shop early, as he always did.");
    expect(at("quiet").sentence).toBe("It was a quiet morning.");
  });

  it("inclui aspas que fecham a frase e aponta a palavra dentro dela", () => {
    const { sentence, wordIndex } = at("Why");
    expect(sentence.startsWith("'Why did he go?'")).toBe(true);
    expect(sentence.slice(wordIndex, wordIndex + 3)).toBe("Why");
  });

  it("wordIndex aponta a palavra clicada mesmo quando ela se repete", () => {
    const source = "The cat saw the cat. Another cat sat.";
    const second = source.indexOf("cat", source.indexOf("cat") + 1);
    const { sentence, wordIndex } = sentenceAround(source, second, second + 3);
    expect(sentence).toBe("The cat saw the cat.");
    expect(sentence.slice(wordIndex, wordIndex + 3)).toBe("cat");
    expect(wordIndex).toBe(sentence.lastIndexOf("cat"));
  });

  it("não quebra a frase em abreviações, iniciais e decimais", () => {
    const source = "Mr. Smith met Dr. Jones at 3.5 percent. J. R. R. Tolkien wrote books.";
    expect(at("Jones", source).sentence).toBe("Mr. Smith met Dr. Jones at 3.5 percent.");
    expect(at("Tolkien", source).sentence).toBe("J. R. R. Tolkien wrote books.");
  });

  it("junta linhas do PDF e desfaz hifenização de fim de linha", () => {
    const source = "The bak-\ner opened his\nshop early. Next.";
    const { sentence, wordIndex } = sentenceAround(source, source.indexOf("opened"), source.indexOf("opened") + 6);
    expect(sentence).toBe("The baker opened his shop early.");
    expect(sentence.slice(wordIndex, wordIndex + 6)).toBe("opened");
  });

  it("título sem ponto final não gruda na primeira frase", () => {
    const source = "The Quiet Morning\nIt was a quiet morning in the small town of Willowbrook. The baker opened his\nshop early.";
    expect(at("small", source).sentence).toBe("It was a quiet morning in the small town of Willowbrook.");
    expect(at("Quiet", source).sentence).toBe("The Quiet Morning");
  });

  it("linha de texto comum que quebra no meio da frase continua sendo a mesma frase", () => {
    const source = "The baker opened his shop early and saw that\nAnna was already waiting outside. Then he smiled.";
    expect(at("Anna", source).sentence).toBe("The baker opened his shop early and saw that Anna was already waiting outside.");
    const narrow = "Everyone knew that the\nweather would turn when\nAnna had gone to the market\nto buy bread. The end.";
    expect(at("market", narrow).sentence).toBe("Everyone knew that the weather would turn when Anna had gone to the market to buy bread.");
  });

  it("sem pontuação, a frase é o texto todo", () => {
    expect(at("morning", "just some words here morning there").sentence).toBe("just some words here morning there");
  });

  it("corta frases enormes ao redor da palavra", () => {
    const long = `${"word ".repeat(120)}TARGET ${"more ".repeat(120)}.`;
    const { sentence, wordIndex } = at("TARGET", long);
    expect(sentence.length).toBeLessThanOrEqual(340);
    expect(sentence.slice(wordIndex, wordIndex + 6)).toBe("TARGET");
    expect(sentence.startsWith("…")).toBe(true);
    expect(sentence.endsWith("…")).toBe(true);
  });

  it("palavra no fim do texto sem ponto final", () => {
    expect(at("end", "This is the end").sentence).toBe("This is the end");
  });
});

describe("joinLines", () => {
  it("une linhas e hifenização", () => {
    expect(joinLines("exam-\nple of a\n  broken   line")).toBe("example of a broken line");
  });
});

describe("normalizeSelection", () => {
  it("aceita expressões curtas, limpando pontuação das pontas", () => {
    expect(normalizeSelection("  look forward to ")).toBe("look forward to");
    expect(normalizeSelection("“in the nick of time.”")).toBe("in the nick of time");
    expect(normalizeSelection("look\nforward")).toBe("look forward");
  });

  it("recusa trechos longos, vazios ou sem letras", () => {
    expect(normalizeSelection("one two three four five six seven eight nine")).toBeNull();
    expect(normalizeSelection("a".repeat(101))).toBeNull();
    expect(normalizeSelection("   ")).toBeNull();
    expect(normalizeSelection("123 456")).toBeNull();
  });
});
