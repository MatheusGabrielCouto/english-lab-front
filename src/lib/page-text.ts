"use client";

import { wordAt, type WordMatch } from "@/lib/reading-context";

/** O texto de uma página do PDF (camada de texto do pdf.js) e onde cada trecho começa. */
export type PageText = {
  text: string;
  /** início de cada nó de texto dentro de `text`, em ordem */
  nodes: { node: Text; start: number }[];
};

/** Junta o texto da camada na ordem de leitura; `<br>` (fim de linha) vira "\n". */
export function readPageText(layer: Element): PageText {
  const nodes: PageText["nodes"] = [];
  let text = "";
  const walker = document.createTreeWalker(layer, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  for (let current = walker.nextNode(); current; current = walker.nextNode()) {
    if (current.nodeType === Node.TEXT_NODE) {
      nodes.push({ node: current as Text, start: text.length });
      text += (current as Text).data;
    } else if ((current as Element).tagName === "BR") {
      text += "\n";
    }
  }
  return { text, nodes };
}

/** Posição global (no texto da página) de um ponto dentro de um nó de texto. */
export function globalOffset(page: PageText, node: Node, offset: number): number | null {
  const found = page.nodes.find((item) => item.node === node);
  return found ? found.start + offset : null;
}

/** O Range do DOM que cobre [start, end) do texto da página (pode atravessar nós). */
export function rangeFor(page: PageText, start: number, end: number): Range | null {
  const locate = (position: number, preferEnd: boolean) => {
    for (let i = page.nodes.length - 1; i >= 0; i--) {
      const item = page.nodes[i];
      const local = position - item.start;
      if (local >= 0 && (preferEnd ? local <= item.node.length : local < item.node.length)) {
        return { node: item.node, offset: local };
      }
    }
    return null;
  };
  const from = locate(start, false);
  const to = locate(end, true);
  if (!from || !to) return null;
  const range = document.createRange();
  range.setStart(from.node, from.offset);
  range.setEnd(to.node, to.offset);
  return range;
}

type CaretDocument = Document & {
  caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null;
  caretRangeFromPoint?: (x: number, y: number) => Range | null;
};

/** O ponto de texto sob o cursor/dedo (Chrome, Safari e Firefox têm APIs diferentes). */
export function caretAt(x: number, y: number): { node: Node; offset: number } | null {
  const doc = document as CaretDocument;
  if (doc.caretPositionFromPoint) {
    const position = doc.caretPositionFromPoint(x, y);
    return position ? { node: position.offsetNode, offset: position.offset } : null;
  }
  const range = doc.caretRangeFromPoint?.(x, y);
  return range ? { node: range.startContainer, offset: range.startOffset } : null;
}

export type ClickedWord = WordMatch & { page: PageText; range: Range };

/**
 * A palavra tocada em (x, y), ou `null` se o toque foi no vazio.
 * Só vale se o ponto estiver em cima (ou muito perto) da palavra, para um clique
 * na margem da página não abrir o dicionário.
 */
export function wordAtPoint(layer: Element, x: number, y: number, slack = 6): ClickedWord | null {
  const caret = caretAt(x, y);
  if (!caret || caret.node.nodeType !== Node.TEXT_NODE || !layer.contains(caret.node)) return null;

  const page = readPageText(layer);
  const position = globalOffset(page, caret.node, caret.offset);
  if (position === null) return null;

  const match = wordAt(page.text, position);
  if (!match) return null;
  const range = rangeFor(page, match.start, match.end);
  if (!range) return null;

  const hit = Array.from(range.getClientRects()).some(
    (rect) => x >= rect.left - slack && x <= rect.right + slack && y >= rect.top - slack && y <= rect.bottom + slack,
  );
  return hit ? { ...match, page, range } : null;
}

type HighlightRegistry = { set(name: string, highlight: unknown): void; delete(name: string): void };

/** Realça um trecho com a Custom Highlight API (sem mexer no DOM do pdf.js). Ignora se não houver suporte. */
export function highlight(range: Range | null) {
  const registry = (CSS as unknown as { highlights?: HighlightRegistry }).highlights;
  const HighlightClass = (globalThis as unknown as { Highlight?: new (...ranges: Range[]) => unknown }).Highlight;
  if (!registry || !HighlightClass) return;
  if (range) registry.set("lookup", new HighlightClass(range));
  else registry.delete("lookup");
}
