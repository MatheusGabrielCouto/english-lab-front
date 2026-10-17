import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/cn";
import { LEVELS, type Level, type TrailLesson, type TrailOverview, type TrailUnit } from "@/lib/trail-types";

/** Deslocamento lateral de cada lição, para o caminho ondular. */
const WAVE = [0, 28, 44, 28, 0, -28, -44, -28];

function Stars({ count }: { count: number }) {
  return (
    <span aria-hidden className="flex gap-0.5 text-sm leading-none">
      {[1, 2, 3].map((n) => (
        <span key={n} className={n <= count ? "" : "opacity-25 grayscale"}>
          ⭐
        </span>
      ))}
    </span>
  );
}

function LessonNode({
  level,
  unit,
  lesson,
  number,
  isNext,
  offset,
}: {
  level: Level;
  unit: TrailUnit;
  lesson: TrailLesson;
  number: number;
  isNext: boolean;
  offset: number;
}) {
  const status = lesson.completed
    ? `concluída, ${lesson.stars} de 3 estrelas`
    : isNext
      ? "próxima lição"
      : "não iniciada";

  return (
    <li style={{ transform: `translateX(${offset}px)` }} className="max-w-full">
      <Link
        href={`/aprender/${level.toLowerCase()}/${unit.slug}/${lesson.slug}`}
        aria-label={`${lesson.title}: ${status}`}
        className="group flex items-center gap-4 rounded-pill py-1 pr-4 outline-offset-4"
      >
        <span className="relative">
          {isNext && (
            <span
              aria-hidden
              className="absolute -top-7 left-1/2 -translate-x-1/2 rounded-pill bg-foreground px-3 py-0.5 text-xs font-bold whitespace-nowrap text-background motion-safe:animate-bounce"
            >
              Começar
            </span>
          )}
          <span
            className={cn(
              "grid size-[4.5rem] place-items-center rounded-full border-2 font-display text-2xl font-semibold transition-transform duration-150 group-hover:-translate-y-0.5 group-active:translate-y-1",
              lesson.completed
                ? "border-primary-edge bg-primary text-on-primary shadow-[0_5px_0_0_var(--color-primary-edge)]"
                : isNext
                  ? "border-butter-edge bg-butter text-ink shadow-[0_5px_0_0_var(--color-butter-edge)]"
                  : "border-sky-edge bg-sky text-ink shadow-[0_5px_0_0_var(--color-sky-edge)]",
            )}
          >
            {lesson.completed ? "✓" : number}
          </span>
        </span>
        <span className="min-w-0">
          <span className="block font-display text-lg leading-tight font-semibold text-balance">{lesson.title}</span>
          <span className="mt-0.5 flex items-center gap-2 text-sm text-muted">
            {lesson.completed ? <Stars count={lesson.stars} /> : <span>{lesson.exerciseCount} exercícios</span>}
          </span>
        </span>
      </Link>
    </li>
  );
}

function UnitCard({ level, unit, nextLessonId }: { level: Level; unit: TrailUnit; nextLessonId: string | null }) {
  const total = unit.lessons.length;
  const percent = total === 0 ? 0 : Math.round((unit.completedLessons / total) * 100);

  return (
    <Card tone={unit.completedLessons === total ? "primary" : "plain"} className="flex flex-col gap-6 md:flex-row md:gap-10">
      <div className="md:w-64 md:shrink-0">
        <span aria-hidden className="grid size-14 place-items-center rounded-2xl bg-butter text-3xl shadow-[0_3px_0_0_var(--color-butter-edge)]">
          {unit.emoji ?? "📘"}
        </span>
        <h3 className="mt-4 font-display text-2xl font-semibold text-balance">{unit.title}</h3>
        {unit.description && <p className="mt-1 text-pretty text-muted">{unit.description}</p>}
        <p className="mt-4 mb-2 text-sm font-bold text-muted">
          {unit.completedLessons} de {total} {total === 1 ? "lição" : "lições"}
        </p>
        <Progress value={percent} label={`Progresso em ${unit.title}`} />
      </div>

      <ol className="flex flex-1 flex-col gap-11 py-8 md:items-center">
        {unit.lessons.map((lesson, index) => (
          <LessonNode
            key={lesson.id}
            level={level}
            unit={unit}
            lesson={lesson}
            number={index + 1}
            isNext={lesson.id === nextLessonId}
            offset={WAVE[index % WAVE.length]}
          />
        ))}
      </ol>
    </Card>
  );
}

/** Níveis → unidades → lições. Níveis sem conteúdo aparecem como "em breve". */
export function TrailMap({ overview }: { overview: TrailOverview }) {
  const startLevel = overview.placement?.level ?? null;
  const byLevel = new Map(overview.levels.map((entry) => [entry.level, entry.units]));
  const nextLessonId = overview.levels
    .flatMap((entry) => entry.units)
    .flatMap((unit) => unit.lessons.map((lesson) => ({ unit, lesson })))
    .find(({ unit, lesson }) => overview.next && unit.slug === overview.next.unit && lesson.slug === overview.next.lesson)?.lesson.id ?? null;

  return (
    <div className="flex flex-col gap-12">
      {LEVELS.map(({ level, name }) => {
        const units = byLevel.get(level) ?? [];
        return (
          <section key={level} aria-labelledby={`level-${level}`}>
            <h2 id={`level-${level}`} className="flex items-center gap-3 font-display text-3xl font-semibold">
              <span className="rounded-pill bg-foreground px-3 py-0.5 text-xl text-background">{level}</span>
              {name}
              {level === startLevel && (
                <span className="rounded-pill bg-butter px-3 py-0.5 text-sm font-bold text-ink">Você começa aqui</span>
              )}
            </h2>
            {units.length === 0 ? (
              <p className="mt-3 rounded-card border-2 border-dashed border-border px-6 py-5 text-muted">
                As lições deste nível chegam em breve.
              </p>
            ) : (
              <div className="mt-5 flex flex-col gap-6">
                {units.map((unit) => (
                  <UnitCard key={unit.id} level={level} unit={unit} nextLessonId={nextLessonId} />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
