import type { Deck, DeckCounts } from "@/lib/anki-types";
import type { Book } from "@/lib/book-types";
import type { TrailOverview, TrailStats } from "@/lib/trail-types";
import { findNext } from "@/lib/trail-view";

/** "Bom dia", "Boa tarde" ou "Boa noite" para a hora (0–23) no fuso do app. */
export function greetingFor(hour: number): string {
  if (hour >= 5 && hour < 12) return "Bom dia";
  if (hour >= 12 && hour < 18) return "Boa tarde";
  return "Boa noite";
}

export type AnkiToday = {
  total: number;
  counts: DeckCounts;
  decks: number;
  /** o baralho com mais cartões para hoje (onde "Estudar agora" leva) */
  top: { id: string; name: string; due: number } | null;
};

const dueOf = (counts: DeckCounts) => counts.new + counts.learning + counts.review;

/**
 * O que há para estudar hoje. Os contadores de um baralho raiz já incluem os subbaralhos, então
 * só as raízes entram na soma (senão o mesmo cartão seria contado duas vezes).
 */
export function ankiToday(decks: Deck[]): AnkiToday {
  const roots = decks.filter((deck) => !deck.parentId);
  const counts = roots.reduce<DeckCounts>(
    (sum, deck) => ({
      new: sum.new + deck.counts.new,
      learning: sum.learning + deck.counts.learning,
      review: sum.review + deck.counts.review,
    }),
    { new: 0, learning: 0, review: 0 },
  );
  const top = roots
    .map((deck) => ({ id: deck.id, name: deck.fullName.split("::").join(" › "), due: dueOf(deck.counts) }))
    .filter((deck) => deck.due > 0)
    .sort((a, b) => b.due - a.due)[0];
  return { total: dueOf(counts), counts, decks: roots.length, top: top ?? null };
}

/** O livro para "continuar lendo": começado, não terminado, o mais recente. */
export function continueReading(books: Book[]): Book | null {
  const reading = books
    .filter((book) => book.status === "READY" && book.progress && book.pageCount && book.progress.page < book.pageCount)
    .sort((a, b) => +new Date(b.progress!.updatedAt) - +new Date(a.progress!.updatedAt));
  return reading[0] ?? null;
}

export function readingPercent(book: Pick<Book, "progress" | "pageCount">): number {
  const total = book.pageCount ?? book.progress?.totalPages ?? 0;
  return total && book.progress ? Math.min(100, Math.round((book.progress.page / total) * 100)) : 0;
}

/** Progresso do nível da próxima lição (para a barra do cartão da trilha). */
export function levelProgress(overview: TrailOverview) {
  const next = findNext(overview);
  if (!next) return null;
  const lessons = (overview.levels.find((entry) => entry.level === next.level)?.units ?? []).flatMap((unit) => unit.lessons);
  const done = lessons.filter((lesson) => lesson.completed).length;
  return { level: next.level, done, total: lessons.length, percent: lessons.length ? Math.round((done / lessons.length) * 100) : 0 };
}

/** Uma frase curta sobre o dia, a partir do XP e do streak. */
export function dayMessage(stats: Pick<TrailStats, "todayXp" | "streak">): string {
  if (stats.todayXp > 0) {
    return stats.streak.current > 1
      ? `Hoje você já ganhou ${stats.todayXp} XP e está há ${stats.streak.current} dias seguidos. Que sequência!`
      : `Hoje você já ganhou ${stats.todayXp} XP. Bom ritmo!`;
  }
  if (stats.streak.current > 0) return `Estude hoje para manter sua sequência de ${stats.streak.current} ${stats.streak.current === 1 ? "dia" : "dias"}.`;
  return "Uma lição curta já conta: bora começar a sequência?";
}
