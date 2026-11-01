import type { Deck, DeckCounts } from "@/lib/anki-types";
import type { Book } from "@/lib/book-types";
import type { ChecklistToday } from "@/lib/checklist-types";
import type { QuestionSummary } from "@/lib/interview-types";
import type { TrailOverview, TrailStats } from "@/lib/trail-types";
import { findNext, type NextLesson } from "@/lib/trail-view";

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

/* ------------------------------------------------------------------ *
 * "Seu próximo passo"
 * ------------------------------------------------------------------ */

export type Step = {
  key: string;
  icon: string;
  title: string;
  detail: string;
  href: string;
  cta: string;
  /** minutos aproximados que o passo leva (para a pessoa decidir se cabe agora) */
  minutes: number | null;
};

/** Cerca de 8 s por cartão, arredondado para cima. */
export const ankiMinutes = (cards: number) => Math.max(1, Math.ceil((cards * 8) / 60));

/**
 * O que fazer agora, em ordem: cartões do Anki que vencem hoje (o tempo conta), a próxima lição,
 * a leitura em andamento, uma pergunta de entrevista e o diário. Itens que o checklist já marcou
 * como feitos hoje saem da lista.
 */
export function nextSteps(input: {
  checklist: ChecklistToday | null;
  anki: AnkiToday;
  lesson: NextLesson | null;
  reading: Book | null;
  interview: QuestionSummary | null;
}): Step[] {
  const { checklist, anki, lesson, reading, interview } = input;
  const items = new Map((checklist?.items ?? []).map((item) => [item.key, item]));
  // sem checklist, nada está "feito"; item desligado pelo aluno também não entra
  const open = (key: string) => {
    const item = items.get(key);
    return !item || (item.enabled && !item.done);
  };

  const steps: Step[] = [];

  if (anki.total > 0 && anki.top && open("anki")) {
    steps.push({
      key: "anki",
      icon: "🃏",
      title: `Revisar ${anki.total} ${anki.total === 1 ? "cartão" : "cartões"} no Anki`,
      detail: `${anki.counts.new} ${anki.counts.new === 1 ? "novo" : "novos"} · ${anki.counts.learning} para aprender · ${anki.counts.review} para revisar`,
      href: `/anki/estudar/${anki.top.id}`,
      cta: "Estudar agora",
      minutes: ankiMinutes(anki.total),
    });
  }

  if (lesson && open("lesson")) {
    steps.push({
      key: "lesson",
      icon: "📘",
      title: `Lição: ${lesson.lesson.title}`,
      detail: `Nível ${lesson.level} · ${lesson.unit.title}`,
      href: `/aprender/${lesson.level.toLowerCase()}/${lesson.unit.slug}/${lesson.lesson.slug}`,
      cta: "Começar a lição",
      minutes: 10,
    });
  }

  if (reading && open("reading")) {
    steps.push({
      key: "reading",
      icon: "📖",
      title: `Continuar lendo: ${reading.title}`,
      detail: `Página ${reading.progress?.page} de ${reading.pageCount ?? reading.progress?.totalPages}. Cinco minutos já contam no checklist.`,
      href: `/biblioteca/${reading.id}`,
      cta: "Continuar",
      minutes: 5,
    });
  }

  if (interview && open("interview")) {
    steps.push({
      key: "interview",
      icon: "💬",
      title: "Responder uma pergunta de entrevista",
      detail: interview.question,
      href: `/entrevista/${interview.slug}`,
      cta: "Praticar",
      minutes: 5,
    });
  }

  if (items.has("diary") && open("diary")) {
    steps.push({
      key: "diary",
      icon: "📝",
      title: "Escrever no diário em inglês",
      detail: "Vinte palavras já contam no checklist.",
      href: "/diario",
      cta: "Escrever",
      minutes: 5,
    });
  }

  // itens manuais e personalizados do checklist que ainda estão abertos
  for (const item of checklist?.items ?? []) {
    if (["anki", "lesson", "reading", "interview", "diary"].includes(item.key)) continue;
    if (!item.enabled || item.done) continue;
    steps.push({
      key: item.key,
      icon: "✅",
      title: item.label,
      detail: item.askMinutes ? `Marque no checklist quando fizer (cerca de ${item.defaultMinutes} min).` : "Marque no checklist quando fizer.",
      href: item.href ?? "/hoje",
      cta: item.href ? "Abrir" : "Ver o checklist",
      minutes: item.askMinutes ? item.defaultMinutes : null,
    });
  }

  return steps;
}
