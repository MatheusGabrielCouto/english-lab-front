import type { LookupResult } from "@/lib/dictionary-types";

const MAX_FIELD = 2000;

export type WordCardKind = "word" | "cloze";

export type WordCardInput = {
  kind: WordCardKind;
  /** a palavra ou expressão tocada */
  text: string;
  /** a frase do livro e onde a palavra começa dentro dela */
  sentence?: { sentence: string; wordIndex: number };
  lookup: LookupResult | null;
  book: { title: string; level: string };
  page: number;
};

export type NewNote =
  | { type: "BASIC"; front: string; back: string; extra?: string; tags: string[] }
  | { type: "CLOZE"; text: string; extra?: string; tags: string[] };

const clip = (value: string) => (value.length > MAX_FIELD ? `${value.slice(0, MAX_FIELD - 1)}…` : value);

/** O sentido em inglês: o da frase (se a Claude deu) ou o primeiro do dicionário. */
export function meaningOf(lookup: LookupResult | null): string {
  return (
    lookup?.translation?.definition ??
    lookup?.lemma?.meanings[0]?.definitions[0]?.definition ??
    lookup?.meanings[0]?.definitions[0]?.definition ??
    ""
  );
}

/** Há conteúdo suficiente para um cartão deste tipo? (o verso/a lacuna não podem ficar vazios) */
export function canBuild(input: WordCardInput): boolean {
  if (input.kind === "cloze") return Boolean(input.sentence?.sentence && locateWord(input));
  return Boolean(input.lookup?.translation?.text || meaningOf(input.lookup));
}

/** Posição da palavra na frase: a indicada, ou a primeira ocorrência (sem diferenciar maiúsculas). */
function locateWord({ text, sentence }: WordCardInput): number | null {
  if (!sentence) return null;
  const { sentence: value, wordIndex } = sentence;
  if (value.slice(wordIndex, wordIndex + text.length).toLowerCase() === text.toLowerCase()) return wordIndex;
  const found = value.toLowerCase().indexOf(text.toLowerCase());
  return found === -1 ? null : found;
}

/** Monta a nota do Anki para a palavra tocada, com a frase e a origem no livro. */
export function buildNote(input: WordCardInput): NewNote {
  const { kind, text, sentence, lookup, book, page } = input;
  const tags = ["livro", book.level.toLowerCase()];
  const source = `📖 ${book.title} · p. ${page}`;
  const meaning = meaningOf(lookup);
  const translation = lookup?.translation;

  if (kind === "cloze") {
    const position = locateWord(input);
    if (!sentence || position === null) throw new Error("Sem frase para criar a lacuna");
    const { sentence: value } = sentence;
    const blank = `${value.slice(0, position)}{{c1::${value.slice(position, position + text.length)}}}${value.slice(position + text.length)}`;
    const extra = [translation?.text, translation?.note, meaning, source].filter(Boolean).join("\n");
    return { type: "CLOZE", text: clip(blank), extra: clip(extra), tags };
  }

  const back = translation?.text ?? meaning;
  if (!back) throw new Error("Sem tradução nem definição para o verso");
  const base = lookup?.lemma?.word;
  const extra = [
    meaning && meaning !== back ? meaning : "",
    base && base.toLowerCase() !== text.toLowerCase() ? `forma de “${base}”` : "",
    translation?.note,
    sentence ? `“${sentence.sentence}”` : "",
    source,
  ]
    .filter(Boolean)
    .join("\n");
  return { type: "BASIC", front: clip(text), back: clip(back), extra: clip(extra), tags };
}

/** Um cartão existente já cobre esta palavra? (frente igual à palavra, ou lacuna exatamente nela) */
export function coversWord(fields: Record<string, string | undefined>, word: string): boolean {
  const target = word.trim().toLowerCase();
  if (!target) return false;
  if ((fields.front ?? "").trim().toLowerCase() === target) return true;
  for (const match of (fields.text ?? "").matchAll(/\{\{c\d+::(.*?)(?:::.*?)?\}\}/gi)) {
    if (match[1].trim().toLowerCase() === target) return true;
  }
  return false;
}
