export type RichPart = { text: string; bold: boolean };

/** Quebra o texto da explicação em parágrafos (linha em branco) e trechos em **negrito**. */
export function richText(text: string): RichPart[][] {
  return text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) =>
      paragraph
        .split("**")
        .map((text, index) => ({ text, bold: index % 2 === 1 }))
        .filter((part) => part.text !== ""),
    );
}
