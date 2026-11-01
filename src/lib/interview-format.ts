import type { QuestionSummary } from "@/lib/interview-types";

export type Correction = { original: string; corrected: string; explanation: string };

export const CATEGORIES: { slug: string; title: string; emoji: string }[] = [
  { slug: "javascript", title: "JavaScript", emoji: "🟨" },
  { slug: "typescript", title: "TypeScript", emoji: "🔷" },
  { slug: "react", title: "React", emoji: "⚛️" },
  { slug: "backend", title: "Backend e Node.js", emoji: "🖥️" },
  { slug: "databases", title: "Bancos de dados", emoji: "🗄️" },
  { slug: "apis", title: "APIs e Web", emoji: "🌐" },
  { slug: "devops", title: "Git e DevOps", emoji: "🚢" },
  { slug: "testing", title: "Testes", emoji: "🧪" },
  { slug: "architecture", title: "Arquitetura", emoji: "🏗️" },
  { slug: "behavioral", title: "Comportamental", emoji: "🤝" },
];

export const categoryTitle = (slug: string) => CATEGORIES.find((entry) => entry.slug === slug)?.title ?? slug;
export const categoryEmoji = (slug: string) => CATEGORIES.find((entry) => entry.slug === slug)?.emoji ?? "💬";

export const DIFFICULTY: Record<1 | 2 | 3, string> = { 1: "Básica", 2: "Intermediária", 3: "Avançada" };

export const parseCategory = (value: string | string[] | undefined) =>
  typeof value === "string" && CATEGORIES.some((entry) => entry.slug === value) ? value : null;

export const parseDifficulty = (value: string | string[] | undefined): 1 | 2 | 3 | null =>
  value === "1" ? 1 : value === "2" ? 2 : value === "3" ? 3 : null;

export function filterQuestions(questions: QuestionSummary[], category: string | null, difficulty: 1 | 2 | 3 | null) {
  return questions.filter((entry) => (!category || entry.category === category) && (!difficulty || entry.difficulty === difficulty));
}

/** Quantas perguntas já foram respondidas, por categoria (e no total). */
export function progressByCategory(questions: QuestionSummary[]) {
  const result = new Map<string, { answered: number; total: number }>();
  for (const entry of questions) {
    const current = result.get(entry.category) ?? { answered: 0, total: 0 };
    current.total++;
    if (entry.attempts > 0) current.answered++;
    result.set(entry.category, current);
  }
  return result;
}

export const SCORE_LABEL: Record<number, string> = {
  1: "Precisa de bastante trabalho",
  2: "Está no caminho",
  3: "Boa base",
  4: "Muito boa",
  5: "Excelente",
};

export const scoreLabel = (score: number) => SCORE_LABEL[Math.min(5, Math.max(1, Math.round(score)))];

export type Segment = { text: string; correction: Correction | null };

/**
 * Divide a resposta do aluno em trechos, marcando os que têm correção (a primeira ocorrência de cada
 * `original`, sem sobreposição). Serve para destacar os erros no próprio texto.
 */
export function highlightCorrections(answer: string, corrections: Correction[]): Segment[] {
  const found: { start: number; end: number; correction: (typeof corrections)[number] }[] = [];
  for (const correction of corrections) {
    if (!correction.original) continue;
    const start = answer.indexOf(correction.original);
    if (start === -1) continue;
    const end = start + correction.original.length;
    if (found.some((other) => start < other.end && end > other.start)) continue;
    found.push({ start, end, correction });
  }
  found.sort((a, b) => a.start - b.start);

  const segments: Segment[] = [];
  let cursor = 0;
  for (const item of found) {
    if (item.start > cursor) segments.push({ text: answer.slice(cursor, item.start), correction: null });
    segments.push({ text: answer.slice(item.start, item.end), correction: item.correction });
    cursor = item.end;
  }
  if (cursor < answer.length) segments.push({ text: answer.slice(cursor), correction: null });
  return segments.length > 0 ? segments : [{ text: answer, correction: null }];
}

export const wordCount = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

/** "3 min 20 s" a partir de segundos. */
export function formatSeconds(total: number) {
  const seconds = Math.max(0, Math.round(total));
  const minutes = Math.floor(seconds / 60);
  return minutes === 0 ? `${seconds} s` : `${minutes} min${seconds % 60 ? ` ${seconds % 60} s` : ""}`;
}

/* ------------------------------------------------------------------ *
 * Situação de cada pergunta, sugestões e simulado
 * ------------------------------------------------------------------ */

export type QuestionStatus = "new" | "review" | "learning" | "mastered";

export const STATUS_LABEL: Record<QuestionStatus, string> = {
  new: "Nova",
  review: "Para revisar",
  learning: "Em progresso",
  mastered: "Dominada",
};

/** Nova (nunca respondida), para revisar (melhor nota até 2), em progresso (3) ou dominada (4 ou 5). */
export function questionStatus(question: Pick<QuestionSummary, "attempts" | "bestScore">): QuestionStatus {
  if (question.attempts === 0) return "new";
  const best = question.bestScore ?? 0;
  if (best >= 4) return "mastered";
  if (best >= 3) return "learning";
  return "review";
}

export const parseStatus = (value: string | string[] | undefined): QuestionStatus | null =>
  value === "new" || value === "review" || value === "learning" || value === "mastered" ? value : null;

/** Busca simples no texto da pergunta e no nome da categoria (sem acentos nem maiúsculas). */
export function searchQuestions(questions: QuestionSummary[], text: string) {
  const fold = (value: string) => value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const words = fold(text).split(/\s+/).filter(Boolean);
  if (words.length === 0) return questions;
  return questions.filter((entry) => {
    const haystack = fold(`${entry.question} ${categoryTitle(entry.category)}`);
    return words.every((word) => haystack.includes(word));
  });
}

/** Números do topo da página: quantas respondidas, dominadas, para revisar e a média das melhores notas. */
export function overview(questions: QuestionSummary[]) {
  const answered = questions.filter((entry) => entry.attempts > 0);
  const scored = answered.filter((entry) => entry.bestScore !== null);
  return {
    total: questions.length,
    answered: answered.length,
    mastered: questions.filter((entry) => questionStatus(entry) === "mastered").length,
    toReview: questions.filter((entry) => questionStatus(entry) === "review").length,
    average: scored.length ? Math.round((scored.reduce((sum, entry) => sum + (entry.bestScore ?? 0), 0) / scored.length) * 10) / 10 : null,
    attempts: questions.reduce((sum, entry) => sum + entry.attempts, 0),
  };
}

/**
 * Qual pergunta praticar agora: primeiro as que precisam de revisão (a pior nota), depois a próxima
 * nova mais fácil (na ordem do conteúdo), depois as em progresso.
 */
export function suggestQuestion(questions: QuestionSummary[]): QuestionSummary | null {
  const review = questions.filter((entry) => questionStatus(entry) === "review").sort((a, b) => (a.bestScore ?? 0) - (b.bestScore ?? 0));
  if (review[0]) return review[0];
  const fresh = questions.filter((entry) => entry.attempts === 0);
  const easiest = Math.min(...fresh.map((entry) => entry.difficulty));
  const nextNew = fresh.find((entry) => entry.difficulty === easiest);
  if (nextNew) return nextNew;
  return questions.filter((entry) => questionStatus(entry) === "learning").sort((a, b) => (a.bestScore ?? 0) - (b.bestScore ?? 0))[0] ?? null;
}

/** A próxima pergunta depois de `slug`: uma nova da mesma categoria, senão qualquer nova, senão a que mais precisa de revisão. */
export function nextAfter(questions: QuestionSummary[], slug: string): QuestionSummary | null {
  const current = questions.find((entry) => entry.slug === slug);
  const others = questions.filter((entry) => entry.slug !== slug);
  const sameCategory = others.find((entry) => entry.attempts === 0 && entry.category === current?.category);
  if (sameCategory) return sameCategory;
  const anyNew = others.find((entry) => entry.attempts === 0);
  if (anyNew) return anyNew;
  return suggestQuestion(others);
}

/** Sorteia `count` perguntas diferentes (Fisher-Yates); `random` entra como parâmetro para os testes. */
export function pickRandom<T>(items: T[], count: number, random: () => number = Math.random): T[] {
  const pool = [...items];
  for (let index = pool.length - 1; index > 0; index--) {
    const swap = Math.floor(random() * (index + 1));
    [pool[index], pool[swap]] = [pool[swap], pool[index]];
  }
  return pool.slice(0, Math.min(count, pool.length));
}

/** Resultado de um simulado: média das notas técnicas e o tempo total. */
export function summarizeMock(results: { score: number | null; seconds: number }[]) {
  const scored = results.filter((entry): entry is { score: number; seconds: number } => entry.score !== null);
  const average = scored.length ? Math.round((scored.reduce((sum, entry) => sum + entry.score, 0) / scored.length) * 10) / 10 : null;
  return { average, seconds: results.reduce((sum, entry) => sum + entry.seconds, 0), answered: results.length };
}

/**
 * Em que tempo a resposta deve vir, quando a pergunta pede um específico. Só devolve o que
 * ajuda o aluno a notar: "Tell me about a time…" pede passado; "How have you used…" pede perfeito.
 */
export function answerTense(question: string): "passado" | "perfeito" | null {
  const text = question.toLowerCase();
  if (/\b(have|has) (you|i|we)\b.*\b(used|worked|built|ever|done|had)\b/.test(text)) return "perfeito";
  if (/\b(tell me about a time|describe a time|did you|what was|how did you|were you|was your)\b/.test(text)) return "passado";
  return null;
}

export const ANSWER_TENSE_HINT = {
  passado: "Responda no passado (I did…)",
  perfeito: "Responda com have/has + particípio (I have used…)",
} as const;
