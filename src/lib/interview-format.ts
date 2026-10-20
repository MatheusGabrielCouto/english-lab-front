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
