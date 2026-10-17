/**
 * Achar a palavra tocada e a frase do livro onde ela aparece.
 * Tudo aqui é texto puro (sem DOM), para dar para testar.
 */

/** Letras (qualquer idioma), com apóstrofo ou hífen no meio: don't, well-known, rock'n'roll. */
const WORD = /\p{L}+(?:['’‐-‑-]\p{L}+)*/gu;

/** Abreviações que terminam em ponto sem encerrar a frase. */
const ABBREVIATIONS = new Set([
  "mr", "mrs", "ms", "dr", "prof", "sr", "jr", "st", "mt", "vs", "etc", "inc", "ltd", "co", "no", "fig", "vol", "gen", "col", "capt", "lt", "sgt", "rev", "hon",
]);

const MAX_SENTENCE = 320;

export interface WordMatch {
  word: string;
  start: number;
  end: number;
}

/** A palavra que contém a posição `offset` (ou encosta nela), ou `null` se não houver. */
export function wordAt(text: string, offset: number): WordMatch | null {
  for (const match of text.matchAll(WORD)) {
    const start = match.index;
    const end = start + match[0].length;
    if (offset >= start && offset <= end) return { word: match[0], start, end };
    if (start > offset) break;
  }
  return null;
}

/** Marca, no texto unido, o fim de um título (uma quebra que sempre encerra a "frase"). */
const HEADING_BREAK = " ";

/** A quebra de linha em `index` separa um título curto (sem pontuação final) do texto seguinte? */
function isHeadingBreak(text: string, index: number, longestLine: number): boolean {
  const lineStart = text.lastIndexOf("\n", index - 1) + 1;
  const line = text.slice(lineStart, index).trim();
  if (!line || line.length > longestLine * 0.4) return false;
  if (/[.!?…,;:"'”’)\]-]$/.test(line)) return false;
  return /^\p{Lu}/u.test(text.slice(index + 1).trimStart());
}

/** O ponto em `index` termina a frase? (não vale para "Mr.", "J. R." nem "3.5") */
function endsSentence(text: string, index: number): boolean {
  const char = text[index];
  if (char === HEADING_BREAK) return true;
  if (char === "!" || char === "?" || char === "…") return true;
  if (char !== ".") return false;

  const next = text[index + 1] ?? "";
  if (next && !/[\s"'”’)\]]/.test(next)) return false; // 3.5, e.g., www.site.com

  const before = /([\p{L}]+)$/u.exec(text.slice(Math.max(0, index - 12), index))?.[1] ?? "";
  if (ABBREVIATIONS.has(before.toLowerCase())) return false;
  if (before.length === 1 && /\p{Lu}/u.test(before)) return false; // iniciais: J. R. R. Tolkien
  return true;
}

/** Une o texto das linhas do PDF: "exam-\nple" vira "example", quebras viram espaço. */
export function joinLines(text: string): string {
  return text
    .replace(/(\p{L})[-­]\n(\p{L})/gu, "$1$2")
    .replace(/­/g, "")
    .replace(/\s*\n\s*/g, " ")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

export interface SentenceMatch {
  sentence: string;
  /** onde a palavra começa dentro de `sentence` */
  wordIndex: number;
}

/**
 * A frase que contém [start, end) em `pageText`. Frases muito longas são cortadas
 * ao redor da palavra. `wordIndex` aponta a palavra dentro da frase devolvida.
 */
export function sentenceAround(pageText: string, start: number, end: number): SentenceMatch {
  // trabalha com o texto já unido (hífens de fim de linha removidos), mantendo o mapa de posições
  const kept: number[] = [];
  let joined = "";
  const source = pageText;
  const longestLine = Math.max(0, ...source.split("\n").map((line) => line.length));
  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    const prev = source[i - 1] ?? "";
    // título ou rótulo solto (linha curta, sem pontuação, e a próxima começa em maiúscula) não faz parte da frase
    if (char === "\n" && isHeadingBreak(source, i, longestLine)) {
      kept.push(i);
      joined += HEADING_BREAK;
      continue;
    }
    // "exam-\nple": descarta hífen e quebra
    if ((char === "-" || char === "­") && source[i + 1] === "\n" && /\p{L}/u.test(prev) && /\p{L}/u.test(source[i + 2] ?? "")) {
      i += 1;
      continue;
    }
    if (char === "­") continue;
    kept.push(i);
    joined += /\s/.test(char) ? " " : char;
  }

  const toJoined = (position: number) => {
    const found = kept.findIndex((original) => original >= position);
    return found === -1 ? joined.length : found;
  };
  const wordStart = toJoined(start);
  const wordEnd = Math.max(wordStart, toJoined(end));

  // recua até o fim da frase anterior
  let from = 0;
  for (let i = wordStart - 1; i >= 0; i--) {
    if (endsSentence(joined, i)) {
      from = i + 1;
      break;
    }
  }
  // avança até o fim desta frase (incluindo aspas e parênteses que fecham)
  let to = joined.length;
  for (let i = wordEnd; i < joined.length; i++) {
    if (endsSentence(joined, i)) {
      to = i + 1;
      while (/["'”’)\]]/.test(joined[to] ?? "")) to++;
      break;
    }
  }

  const slice = joined.slice(from, to);
  const leading = slice.length - slice.trimStart().length;
  let sentence = slice.replaceAll(HEADING_BREAK, "").trim();
  let index = wordStart - from - leading;

  // frase longa demais: mantém uma janela ao redor da palavra, cortando em limites de palavra
  if (sentence.length > MAX_SENTENCE) {
    const wordLength = wordEnd - wordStart;
    const room = Math.max(0, (MAX_SENTENCE - wordLength) / 2);
    let a = Math.max(0, Math.floor(index - room));
    let b = Math.min(sentence.length, Math.ceil(index + wordLength + room));
    while (a > 0 && a < index && sentence[a - 1] !== " ") a++;
    while (b < sentence.length && b > index + wordLength && sentence[b] !== " ") b--;
    sentence = `${a > 0 ? "…" : ""}${sentence.slice(a, b).trim()}${b < sentence.length ? "…" : ""}`;
    index = index - a + (a > 0 ? 1 : 0);
  }

  return { sentence, wordIndex: Math.max(0, index) };
}

/** Texto selecionado como expressão: espaços normalizados, até `maxWords` palavras. */
export function normalizeSelection(selected: string, maxWords = 8, maxLength = 100): string | null {
  const text = joinLines(selected).replace(/^[^\p{L}]+|[^\p{L}'’.!?]+$/gu, "").replace(/[.!?]+$/, "");
  if (!text || text.length > maxLength) return null;
  const words = text.match(WORD) ?? [];
  return words.length >= 1 && words.length <= maxWords ? text : null;
}
