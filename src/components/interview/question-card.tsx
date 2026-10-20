import Link from "next/link";
import { cn } from "@/lib/cn";
import { categoryEmoji, categoryTitle, DIFFICULTY } from "@/lib/interview-format";
import type { QuestionSummary } from "@/lib/interview-types";

export function QuestionCard({ question }: { question: QuestionSummary }) {
  const answered = question.attempts > 0;
  return (
    <Link
      href={`/entrevista/${question.slug}`}
      className="group flex h-full flex-col gap-3 rounded-card border-2 border-border bg-surface p-5 shadow-[0_4px_0_0_var(--color-border)] transition-colors hover:bg-surface-soft"
    >
      <div className="flex flex-wrap items-center gap-2 text-sm font-bold">
        <span className="rounded-pill bg-surface-soft px-3 py-0.5">
          <span aria-hidden>{categoryEmoji(question.category)}</span> {categoryTitle(question.category)}
        </span>
        <span className="text-muted">{DIFFICULTY[question.difficulty]}</span>
      </div>
      <h3 className="font-display text-xl leading-snug font-semibold text-balance">{question.question}</h3>
      <p className={cn("mt-auto text-sm font-bold", answered ? "text-primary" : "text-muted")}>
        {answered
          ? `✓ ${question.attempts} ${question.attempts === 1 ? "tentativa" : "tentativas"} · melhor nota ${question.bestScore ?? "–"}/5`
          : "Ainda não respondida"}
      </p>
    </Link>
  );
}
