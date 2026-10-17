import { describe, expect, it } from "vitest";
import { LEVELS, levelIndex, levelName } from "./trail-types";

describe("níveis", () => {
  it("a escada vai de A1 a C2, em ordem", () => {
    expect(LEVELS.map((entry) => entry.level)).toEqual(["A1", "A2", "B1", "B2", "C1", "C2"]);
    expect(levelIndex("A1")).toBeLessThan(levelIndex("B1"));
    expect(levelIndex("C2")).toBe(5);
  });

  it("cada nível tem nome em português", () => {
    expect(levelName("A1")).toBe("Iniciante");
    expect(levelName("B1")).toBe("Intermediário");
  });
});
