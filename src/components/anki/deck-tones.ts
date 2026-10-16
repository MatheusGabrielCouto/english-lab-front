import type { Deck } from "@/lib/anki-types";

export type Tone = "primary" | "sky" | "butter" | "coral" | "lavender";

/** Cada baralho raiz ganha uma cor; os subbaralhos herdam a do pai. */
export const tones: Record<Tone, { tile: string; ring: string }> = {
  primary: { tile: "bg-primary text-on-primary", ring: "border-primary/40" },
  sky: { tile: "bg-sky text-ink", ring: "border-sky/50" },
  butter: { tile: "bg-butter text-ink", ring: "border-butter/70" },
  coral: { tile: "bg-coral text-ink", ring: "border-coral/50" },
  lavender: { tile: "bg-lavender text-ink", ring: "border-lavender/50" },
};

const toneOrder: Tone[] = ["primary", "sky", "butter", "coral", "lavender"];

/** Cor do baralho, igual à da lista (depende da posição do baralho raiz). */
export function toneFor(decks: Deck[], deck: Deck) {
  const byId = new Map(decks.map((item) => [item.id, item]));
  let root = deck;
  while (root.parentId && byId.has(root.parentId)) root = byId.get(root.parentId)!;
  const index = decks.filter((item) => !item.parentId).findIndex((item) => item.id === root.id);
  return tones[toneOrder[Math.max(index, 0) % toneOrder.length]];
}

export function toneAt(rootIndex: number) {
  return tones[toneOrder[rootIndex % toneOrder.length]];
}
