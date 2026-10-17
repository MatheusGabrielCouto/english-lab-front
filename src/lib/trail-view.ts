import { LEVELS, type Level, type TrailLesson, type TrailOverview, type TrailUnit, levelIndex } from "@/lib/trail-types";

export type LevelSummary = {
  level: Level;
  name: string;
  hasContent: boolean;
  units: number;
  lessons: number;
  done: number;
  /** estrelas conquistadas / possíveis */
  stars: number;
  maxStars: number;
};

/** Os seis níveis com o andamento de cada um (níveis sem lições vêm zerados e `hasContent: false`). */
export function levelSummaries(overview: TrailOverview): LevelSummary[] {
  const byLevel = new Map(overview.levels.map((entry) => [entry.level, entry.units]));
  return LEVELS.map(({ level, name }) => {
    const units = byLevel.get(level) ?? [];
    const lessons = units.flatMap((unit) => unit.lessons);
    return {
      level,
      name,
      hasContent: lessons.length > 0,
      units: units.length,
      lessons: lessons.length,
      done: lessons.filter((lesson) => lesson.completed).length,
      stars: lessons.reduce((sum, lesson) => sum + lesson.stars, 0),
      maxStars: lessons.length * 3,
    };
  });
}

export function parseLevel(value: string | string[] | undefined): Level | null {
  const text = (Array.isArray(value) ? value[0] : value)?.toUpperCase();
  return LEVELS.find((entry) => entry.level === text)?.level ?? null;
}

export type NextLesson = { level: Level; unit: TrailUnit; lesson: TrailLesson; number: number };

/** A lição que o servidor sugere (`overview.next`), com a unidade e a posição dela. */
export function findNext(overview: TrailOverview): NextLesson | null {
  const next = overview.next;
  if (!next) return null;
  const entry = overview.levels.find((item) => item.level === next.level);
  const unit = entry?.units.find((item) => item.slug === next.unit);
  const index = unit?.lessons.findIndex((item) => item.slug === next.lesson) ?? -1;
  if (!unit || index === -1) return null;
  return { level: next.level, unit, lesson: unit.lessons[index], number: index + 1 };
}

/**
 * Qual nível mostrar: o da URL (se existir), senão o da próxima lição, o do teste de nível
 * (se tiver lições), o primeiro com lições e, por fim, o A1.
 */
export function pickLevel(requested: Level | null, overview: TrailOverview): Level {
  if (requested) return requested;
  const summaries = levelSummaries(overview);
  const withContent = summaries.filter((summary) => summary.hasContent);
  if (overview.next) return overview.next.level;
  if (overview.placement && withContent.some((summary) => summary.level === overview.placement!.level)) {
    return overview.placement.level;
  }
  return withContent.at(-1)?.level ?? withContent[0]?.level ?? "A1";
}

export type UnitStatus = "done" | "doing" | "new";

export function unitStatus(unit: Pick<TrailUnit, "completedLessons" | "lessons">): UnitStatus {
  if (unit.lessons.length > 0 && unit.completedLessons === unit.lessons.length) return "done";
  return unit.completedLessons > 0 ? "doing" : "new";
}

/** Nível do aluno em relação a um nível: "abaixo" já foi dominado no teste. */
export function relationToPlacement(level: Level, placement: Level | null): "below" | "start" | "above" | null {
  if (!placement) return null;
  const diff = levelIndex(level) - levelIndex(placement);
  return diff < 0 ? "below" : diff === 0 ? "start" : "above";
}
