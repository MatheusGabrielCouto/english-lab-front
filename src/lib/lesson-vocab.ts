import type { LessonData } from "@/lib/trail-types";

const clean = (value: string) => value.replace(/::/g, "-").trim();

/** Baralho onde o vocabulário da lição vai parar: Trilha › A1 › Cumprimentos. */
export function vocabDeckPath(lesson: Pick<LessonData, "unit">): string[] {
  return ["Trilha", lesson.unit.level, clean(lesson.unit.title).slice(0, 80) || "Unidade"];
}

/** Um cartão básico por palavra, marcando de onde veio. */
export function vocabNotes(lesson: Pick<LessonData, "unit" | "title" | "vocab">) {
  return lesson.vocab.map((item) => ({
    type: "BASIC" as const,
    front: item.front,
    back: item.back,
    extra: `📘 ${lesson.unit.title} › ${lesson.title}`,
    tags: ["trilha", lesson.unit.level.toLowerCase()],
  }));
}
