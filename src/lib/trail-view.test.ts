import { describe, expect, it } from "vitest";
import type { TrailLesson, TrailOverview, TrailUnit } from "./trail-types";
import { findNext, levelSummaries, parseLevel, pickLevel, relationToPlacement, unitStatus } from "./trail-view";

const lesson = (slug: string, stars: 0 | 1 | 2 | 3 = 0): TrailLesson => ({
  id: slug,
  slug,
  title: slug,
  description: null,
  xp: 10,
  exerciseCount: 10,
  completed: stars > 0,
  bestScore: stars > 0 ? 90 : null,
  stars,
});

const unit = (slug: string, lessons: TrailLesson[]): TrailUnit => ({
  id: slug,
  slug,
  title: slug,
  description: null,
  emoji: null,
  completedLessons: lessons.filter((item) => item.completed).length,
  lessons,
});

const overview = (overrides: Partial<TrailOverview> = {}): TrailOverview => ({
  stats: { xp: 0, todayXp: 0, streak: { current: 0, longest: 0, activeToday: false }, week: [] },
  placement: null,
  next: null,
  levels: [
    { level: "A1", units: [unit("u1", [lesson("a", 3), lesson("b", 1)]), unit("u2", [lesson("c")])] },
    { level: "A2", units: [unit("u3", [lesson("d")])] },
  ],
  ...overrides,
});

describe("levelSummaries", () => {
  it("conta lições, concluídas e estrelas; níveis sem lições vêm zerados", () => {
    const summaries = levelSummaries(overview());
    expect(summaries.map((item) => item.level)).toEqual(["A1", "A2", "B1", "B2", "C1", "C2"]);
    expect(summaries[0]).toMatchObject({ units: 2, lessons: 3, done: 2, stars: 4, maxStars: 9, hasContent: true });
    expect(summaries[2]).toMatchObject({ hasContent: false, lessons: 0, done: 0, maxStars: 0 });
  });
});

describe("parseLevel", () => {
  it("aceita minúsculas e rejeita o que não é nível", () => {
    expect(parseLevel("a2")).toBe("A2");
    expect(parseLevel(["b1", "c1"])).toBe("B1");
    expect(parseLevel("z9")).toBeNull();
    expect(parseLevel(undefined)).toBeNull();
  });
});

describe("findNext", () => {
  it("acha a unidade, a lição e o número dela", () => {
    const found = findNext(overview({ next: { level: "A1", unit: "u1", lesson: "b", title: "b" } }));
    expect(found).toMatchObject({ level: "A1", number: 2 });
    expect(found?.unit.slug).toBe("u1");
  });

  it("sem sugestão ou com sugestão que não existe mais, devolve null", () => {
    expect(findNext(overview())).toBeNull();
    expect(findNext(overview({ next: { level: "A1", unit: "u1", lesson: "zzz", title: "x" } }))).toBeNull();
  });
});

describe("pickLevel", () => {
  it("usa o da URL; senão o da próxima lição", () => {
    expect(pickLevel("A2", overview())).toBe("A2");
    expect(pickLevel(null, overview({ next: { level: "A2", unit: "u3", lesson: "d", title: "d" } }))).toBe("A2");
  });

  it("sem próxima lição: nível do teste (se tiver lições), senão o mais alto com lições", () => {
    const base = { stats: overview().stats, next: null };
    expect(pickLevel(null, overview({ ...base, placement: { level: "A2", score: 50, createdAt: "" } }))).toBe("A2");
    expect(pickLevel(null, overview({ ...base, placement: { level: "C1", score: 90, createdAt: "" } }))).toBe("A2");
    expect(pickLevel(null, overview({ levels: [] }))).toBe("A1");
  });
});

describe("unitStatus", () => {
  it("nova, em andamento ou concluída", () => {
    expect(unitStatus(unit("x", [lesson("a"), lesson("b")]))).toBe("new");
    expect(unitStatus(unit("x", [lesson("a", 1), lesson("b")]))).toBe("doing");
    expect(unitStatus(unit("x", [lesson("a", 1), lesson("b", 2)]))).toBe("done");
  });
});

describe("relationToPlacement", () => {
  it("compara o nível com o do teste", () => {
    expect(relationToPlacement("A1", null)).toBeNull();
    expect(relationToPlacement("A1", "B1")).toBe("below");
    expect(relationToPlacement("B1", "B1")).toBe("start");
    expect(relationToPlacement("B2", "B1")).toBe("above");
  });
});
