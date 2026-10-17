import Link from "next/link";
import { Mascot } from "@/components/mascot";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/cn";
import type { Level, TrailLesson, TrailUnit } from "@/lib/trail-types";
import { type LevelSummary, type UnitStatus, relationToPlacement, unitStatus } from "@/lib/trail-view";

function Stars({ count }: { count: number }) {
  return (
    <span role="img" aria-label={`${count} de 3 estrelas`} className="flex gap-0.5 text-sm leading-none">
      {[1, 2, 3].map((n) => (
        <span key={n} aria-hidden className={n <= count ? "" : "opacity-25 grayscale"}>
          ⭐
        </span>
      ))}
    </span>
  );
}

function LessonCard({
  level,
  unit,
  lesson,
  number,
  isNext,
}: {
  level: Level;
  unit: TrailUnit;
  lesson: TrailLesson;
  number: number;
  isNext: boolean;
}) {
  return (
    <li>
      <Link
        href={`/aprender/${level.toLowerCase()}/${unit.slug}/${lesson.slug}`}
        aria-label={`${lesson.title}: ${
          lesson.completed ? `concluída, ${lesson.stars} de 3 estrelas` : isNext ? "próxima lição" : "não iniciada"
        }`}
        className={cn(
          "group relative flex h-full flex-col gap-3 rounded-2xl border-2 p-4 transition-[transform,border-color] duration-150 hover:-translate-y-0.5",
          lesson.completed
            ? "border-primary/40 bg-primary-soft"
            : isNext
              ? "border-butter-edge bg-butter-soft ring-4 ring-butter/40"
              : "border-border bg-surface hover:border-sky",
        )}
      >
        {isNext && (
          <span className="absolute -top-3 right-3 rounded-pill bg-foreground px-3 py-0.5 text-xs font-bold text-background">
            Próxima
          </span>
        )}
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className={cn(
              "grid size-12 shrink-0 place-items-center rounded-full border-2 font-display text-xl font-semibold",
              lesson.completed
                ? "border-primary-edge bg-primary text-on-primary"
                : isNext
                  ? "border-butter-edge bg-butter text-ink"
                  : "border-sky-edge bg-sky text-ink",
            )}
          >
            {lesson.completed ? "✓" : number}
          </span>
          <h4 className="font-display text-lg leading-tight font-semibold text-balance">{lesson.title}</h4>
        </div>
        {lesson.description && <p className="text-sm text-pretty text-muted">{lesson.description}</p>}
        <div className="mt-auto flex items-center justify-between gap-2 pt-1 text-sm font-bold text-muted">
          {lesson.completed ? <Stars count={lesson.stars} /> : <span>{lesson.exerciseCount} exercícios</span>}
          <span className="tabular-nums">+{lesson.xp} XP</span>
        </div>
      </Link>
    </li>
  );
}

const statusLabel: Record<UnitStatus, string | null> = { done: "Concluída", doing: "Em andamento", new: null };

function UnitSection({ level, unit, nextLessonId }: { level: Level; unit: TrailUnit; nextLessonId: string | null }) {
  const status = unitStatus(unit);
  const total = unit.lessons.length;
  return (
    <section aria-labelledby={`unit-${unit.id}`}>
      <Card tone={status === "done" ? "primary" : "plain"} className="p-5 md:p-6">
        <header className="flex flex-wrap items-center gap-4">
          <span
            aria-hidden
            className="grid size-14 shrink-0 place-items-center rounded-2xl bg-butter text-3xl shadow-[0_3px_0_0_var(--color-butter-edge)]"
          >
            {unit.emoji ?? "📘"}
          </span>
          <div className="min-w-0 flex-1">
            <h3 id={`unit-${unit.id}`} className="font-display text-2xl font-semibold text-balance">
              {unit.title}
            </h3>
            {unit.description && <p className="text-pretty text-muted">{unit.description}</p>}
          </div>
          <div className="flex flex-col items-end gap-1.5 text-sm font-bold text-muted">
            {statusLabel[status] && (
              <span
                className={cn(
                  "rounded-pill px-3 py-0.5",
                  status === "done" ? "bg-primary text-on-primary" : "bg-butter-soft text-foreground",
                )}
              >
                {statusLabel[status]}
              </span>
            )}
            <span className="tabular-nums">
              {unit.completedLessons}/{total} {total === 1 ? "lição" : "lições"}
            </span>
          </div>
        </header>

        <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {unit.lessons.map((lesson, index) => (
            <LessonCard
              key={lesson.id}
              level={level}
              unit={unit}
              lesson={lesson}
              number={index + 1}
              isNext={lesson.id === nextLessonId}
            />
          ))}
        </ol>
      </Card>
    </section>
  );
}

const relationBadge = {
  below: "Já dominado no teste",
  start: "Você começa aqui",
  above: null,
} as const;

/** Um nível por vez: resumo, unidades e cartões de lição. */
export function LevelView({
  summary,
  units,
  nextLessonId,
  placement,
  lastLevelWithContent,
}: {
  summary: LevelSummary;
  units: TrailUnit[];
  nextLessonId: string | null;
  placement: Level | null;
  lastLevelWithContent: Level | null;
}) {
  const relation = relationToPlacement(summary.level, placement);
  const badge = relation ? relationBadge[relation] : null;
  const percent = summary.lessons === 0 ? 0 : Math.round((summary.done / summary.lessons) * 100);

  return (
    <div>
      <header>
        <h2 className="flex flex-wrap items-center gap-3 font-display text-3xl font-semibold">
          <span className="rounded-pill bg-foreground px-3 py-0.5 text-xl text-background">{summary.level}</span>
          {summary.name}
          {badge && <span className="rounded-pill bg-butter px-3 py-0.5 text-sm font-bold text-ink">{badge}</span>}
        </h2>
        {summary.hasContent && (
          <div className="mt-4 flex flex-col gap-2 sm:max-w-md">
            <p className="text-sm font-bold text-muted tabular-nums">
              {summary.done} de {summary.lessons} lições · {summary.stars}/{summary.maxStars} ⭐
            </p>
            <Progress value={percent} label={`Progresso no nível ${summary.level}`} />
          </div>
        )}
      </header>

      {summary.hasContent ? (
        <div className="mt-8 flex flex-col gap-6">
          {units.map((unit) => (
            <UnitSection key={unit.id} level={summary.level} unit={unit} nextLessonId={nextLessonId} />
          ))}
        </div>
      ) : (
        <Card tone="plain" className="mt-8 flex flex-col items-center gap-4 border-dashed p-8 text-center">
          <Mascot className="w-24" />
          <p className="max-w-sm text-lg text-pretty text-muted">
            As lições do {summary.level} chegam em breve.
            {lastLevelWithContent && " Enquanto isso, que tal reforçar o nível anterior?"}
          </p>
          {lastLevelWithContent && (
            <Link
              href={`/trilha?nivel=${lastLevelWithContent.toLowerCase()}`}
              scroll={false}
              className="font-bold underline underline-offset-4"
            >
              Ir para o {lastLevelWithContent}
            </Link>
          )}
        </Card>
      )}
    </div>
  );
}
