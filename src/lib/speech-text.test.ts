import { describe, expect, it } from "vitest";
import { cleanSpokenText } from "./speech-text";

describe("cleanSpokenText", () => {
  it("lê só a palavra: sem classe gramatical e sem pronúncia", () => {
    expect(cleanSpokenText("abandon (verb)\n/əˈbændən/")).toBe("abandon");
    expect(cleanSpokenText("a (noun)\n/eɪ/")).toBe("a");
    expect(cleanSpokenText("cannot\n/ˈkænɑːt/")).toBe("cannot");
  });

  it("reconhece artigo, partícula e abreviação", () => {
    expect(cleanSpokenText("the (article)")).toBe("the");
    expect(cleanSpokenText("to (particle)")).toBe("to");
    expect(cleanSpokenText("e.g. (abbreviation)")).toBe("e.g.");
  });

  it("aceita mais de uma classe e maiúsculas", () => {
    expect(cleanSpokenText("light (noun, adjective)")).toBe("light");
    expect(cleanSpokenText("go (Verb)")).toBe("go");
  });

  it("não mexe em frases comuns", () => {
    expect(cleanSpokenText("She {{c1::has lived}} here (since 2020).")).toBe("She {{c1::has lived}} here (since 2020).");
    expect(cleanSpokenText("Do you prefer and/or?")).toBe("Do you prefer and/or?");
    expect(cleanSpokenText("the verb (to run) is irregular")).toBe("the verb (to run) is irregular");
    expect(cleanSpokenText("apple\nfruit")).toBe("apple\nfruit");
  });
});
