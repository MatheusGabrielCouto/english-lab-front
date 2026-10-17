import { describe, expect, it } from "vitest";
import { splitReading } from "./reading-prompt";

describe("splitReading", () => {
  it("separa o texto e a pergunta", () => {
    expect(splitReading("Leia: “Ana has never been abroad. She wants to visit Italy.” Qual afirmação é verdadeira?")).toEqual({
      passage: "Ana has never been abroad. She wants to visit Italy.",
      question: "Qual afirmação é verdadeira?",
    });
  });

  it("aceita aspas simples e apóstrofos dentro do texto", () => {
    const result = splitReading("Leia: “I can't log in. I clicked 'Reset password' and ‘waited’.” O que a pessoa fez?");
    expect(result?.passage).toBe("I can't log in. I clicked 'Reset password' and ‘waited’.");
    expect(result?.question).toBe("O que a pessoa fez?");
  });

  it("devolve null para outros enunciados", () => {
    expect(splitReading("Qual é o passado de “play”?")).toBeNull();
    expect(splitReading("Ouça: “If I were you…” Isso é…")).toBeNull();
    expect(splitReading("Leia: “texto sem pergunta”")).toBeNull();
  });
});
