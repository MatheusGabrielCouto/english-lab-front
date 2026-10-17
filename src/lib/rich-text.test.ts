import { describe, expect, it } from "vitest";
import { richText } from "./rich-text";

describe("richText", () => {
  it("separa parágrafos e marca o negrito", () => {
    expect(richText("Use **-ed** no fim.\n\nSegundo parágrafo.")).toEqual([
      [
        { text: "Use ", bold: false },
        { text: "-ed", bold: true },
        { text: " no fim.", bold: false },
      ],
      [{ text: "Segundo parágrafo.", bold: false }],
    ]);
  });

  it("ignora espaços e parágrafos vazios, e negrito no começo", () => {
    expect(richText("  \n\n**Atenção:** cuidado\n\n\n ")).toEqual([
      [
        { text: "Atenção:", bold: true },
        { text: " cuidado", bold: false },
      ],
    ]);
    expect(richText("")).toEqual([]);
  });

  it("um ** sem par deixa o resto em negrito, sem quebrar", () => {
    expect(richText("a **b")).toEqual([
      [
        { text: "a ", bold: false },
        { text: "b", bold: true },
      ],
    ]);
  });
});
