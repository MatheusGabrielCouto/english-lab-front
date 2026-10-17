"use client";

import { StudySections, TipsCard } from "@/components/trail/study-view";
import { VocabToAnki } from "@/components/trail/vocab-to-anki";
import { Mascot } from "@/components/mascot";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { FinishResult, LessonData } from "@/lib/trail-types";

function headline(result: FinishResult) {
  if (result.perfect) return "Lição perfeita!";
  if (result.score >= 85) return "Mandou muito bem!";
  if (result.score >= 60) return "Lição concluída!";
  return "Concluída — vale repetir!";
}

export function LessonSummary({
  lesson,
  result,
  onRestart,
}: {
  lesson: LessonData;
  result: FinishResult;
  onRestart: () => void;
}) {
  const days = result.streak.current === 1 ? "dia" : "dias";
  const nextHref = lesson.nextLesson
    ? `/aprender/${lesson.unit.level.toLowerCase()}/${lesson.unit.slug}/${lesson.nextLesson.slug}`
    : "/trilha";

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col items-center px-5 py-10 text-center">
      <Mascot className="w-32" />
      <h1 className="mt-4 font-display text-4xl font-semibold text-balance">{headline(result)}</h1>
      <p aria-label={`${result.stars} de 3 estrelas`} className="mt-2 flex gap-1 text-4xl">
        {[1, 2, 3].map((n) => (
          <span key={n} aria-hidden className={n <= result.stars ? "" : "opacity-25 grayscale"}>
            ⭐
          </span>
        ))}
      </p>

      <dl className="mt-8 grid w-full grid-cols-3 gap-3">
        <Card tone="butter" className="p-4">
          <dt className="text-sm font-bold text-muted">XP</dt>
          <dd className="mt-1 font-display text-3xl font-semibold tabular-nums">+{result.xp}</dd>
        </Card>
        <Card tone="primary" className="p-4">
          <dt className="text-sm font-bold text-muted">De primeira</dt>
          <dd className="mt-1 font-display text-3xl font-semibold tabular-nums">
            {result.correct}/{result.total}
          </dd>
        </Card>
        <Card tone="coral" className="p-4">
          <dt className="text-sm font-bold text-muted">Sequência</dt>
          <dd className="mt-1 font-display text-3xl font-semibold tabular-nums">
            🔥 {result.streak.current}
          </dd>
        </Card>
      </dl>

      <p className="mt-5 text-lg text-pretty text-muted">
        {result.extendedToday
          ? `Sequência de ${result.streak.current} ${days}! Volte amanhã para continuar.`
          : result.firstCompletion
            ? `Você já estudou hoje: a sequência segue em ${result.streak.current} ${days}.`
            : "Repetir a lição rende metade do XP, mas treina de verdade."}
      </p>

      {lesson.study && (
        <div className="mt-8 w-full text-left">
          <TipsCard tips={lesson.study.tips} />
          <details className="group mt-4 rounded-card border-2 border-border bg-surface">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 font-display text-lg font-semibold [&::-webkit-details-marker]:hidden">
              Rever a explicação
              <span aria-hidden className="text-muted transition-transform group-open:rotate-180">
                ▾
              </span>
            </summary>
            <div className="border-t-2 border-border px-5 py-5">
              <StudySections study={lesson.study} />
            </div>
          </details>
          {result.correct < result.total && (
            <p className="mt-3 text-pretty text-muted">
              Errou algum? Releia a explicação acima e refaça a lição para fixar.
            </p>
          )}
        </div>
      )}

      <VocabToAnki lesson={lesson} />

      <div className="mt-10 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
        <ButtonLink href={nextHref} size="lg">
          {lesson.nextLesson ? `Próxima: ${lesson.nextLesson.title}` : "Voltar à trilha"}
        </ButtonLink>
        <Button variant="ghost" size="lg" onClick={onRestart}>
          Refazer
        </Button>
        {lesson.nextLesson && (
          <ButtonLink href="/trilha" variant="ghost" size="lg">
            Trilha
          </ButtonLink>
        )}
      </div>
    </main>
  );
}
