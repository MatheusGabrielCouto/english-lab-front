import Link from "next/link";
import { cn } from "@/lib/cn";
import { categoryEmoji, categoryTitle, DIFFICULTY, questionStatus, STATUS_LABEL, type QuestionStatus } from "@/lib/interview-format";
import type { QuestionSummary } from "@/lib/interview-types";

const STATUS_STYLE: Record<QuestionStatus, string> = {
  new: "bg-surface-soft text-muted",
  review: "bg-coral-soft text-coral-edge",
  learning: "bg-sky-soft text-sky-edge",
  mastered: "bg-primary-soft text-primary",
};

function Dots({ score }: { score: number }) {
  return (
    <span role="img" aria-label={`melhor nota ${score} de 5`} className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} aria-hidden className={cn("size-2.5 rounded-full", n <= score ? "bg-primary" : "bg-border")} />
      ))}
    </span>
  );
}

export function QuestionCard({ question }: { question: QuestionSummary }) {
  const answered = question.attempts > 0;
  const status = questionStatus(question);
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
        <span className={cn("ml-auto rounded-pill px-2.5 py-0.5 text-xs", STATUS_STYLE[status])}>{STATUS_LABEL[status]}</span>
      </div>
      <h3 className="font-display text-xl leading-snug font-semibold text-balance">{question.question}</h3>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 text-sm font-bold">
        <span className={answered ? "text-foreground" : "text-muted"}>
          {answered ? `${question.attempts} ${question.attempts === 1 ? "tentativa" : "tentativas"}` : "Ainda não respondida"}
        </span>
        {question.bestScore !== null && <Dots score={question.bestScore} />}
      </div>
    </Link>
  );
}
