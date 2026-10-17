import { Mascot } from "@/components/mascot";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { NextLesson } from "@/lib/trail-view";

/** O grande botão da tela: a próxima lição, com o contexto de onde ela está. */
export function ContinueCard({ next, started }: { next: NextLesson | null; started: boolean }) {
  if (!next) {
    return (
      <Card tone="primary" className="flex h-full flex-col justify-center gap-4 p-6 md:p-8">
        <div className="flex items-center gap-5">
          <Mascot className="w-20 shrink-0" />
          <div>
            <h2 className="font-display text-2xl font-semibold text-balance">Você está em dia!</h2>
            <p className="mt-1 text-pretty text-muted">
              Concluiu todas as lições disponíveis. Treine com o Anki enquanto chegam as próximas.
            </p>
          </div>
        </div>
        <div>
          <ButtonLink href="/anki">Revisar no Anki</ButtonLink>
        </div>
      </Card>
    );
  }

  const { unit, lesson, number, level } = next;
  return (
    <Card tone="butter" className="flex h-full flex-col justify-between gap-6 p-6 md:p-8">
      <div className="flex items-start gap-4">
        <span
          aria-hidden
          className="grid size-16 shrink-0 place-items-center rounded-2xl bg-butter text-3xl shadow-[0_4px_0_0_var(--color-butter-edge)]"
        >
          {unit.emoji ?? "📘"}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-muted">
            {started ? "Continue de onde parou" : "Comece por aqui"} · {level}
          </p>
          <h2 className="mt-1 font-display text-3xl leading-tight font-semibold text-balance">{lesson.title}</h2>
          <p className="mt-1 text-muted">
            {unit.title} · lição {number} de {unit.lessons.length}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <ButtonLink size="lg" href={`/aprender/${level.toLowerCase()}/${unit.slug}/${lesson.slug}`}>
          {started ? "Continuar" : "Começar"}
        </ButtonLink>
        <p className="text-sm font-bold text-muted">
          {lesson.exerciseCount} exercícios · +{lesson.xp} XP
        </p>
      </div>
    </Card>
  );
}
