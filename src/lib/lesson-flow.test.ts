import { describe, expect, it } from "vitest";
import { advance, currentKey, isFinished, progressOf, startFlow } from "./lesson-flow";
import { seededShuffle } from "./shuffle";

describe("lesson-flow", () => {
  it("começa pelo primeiro e sem progresso", () => {
    const flow = startFlow(["a", "b", "c"]);
    expect(currentKey(flow)).toBe("a");
    expect(progressOf(flow)).toBe(0);
    expect(isFinished(flow)).toBe(false);
  });

  it("acertar tira da fila e avança o progresso", () => {
    let flow = startFlow(["a", "b"]);
    flow = advance(flow, true);
    expect(currentKey(flow)).toBe("b");
    expect(progressOf(flow)).toBe(50);
    flow = advance(flow, true);
    expect(isFinished(flow)).toBe(true);
    expect(progressOf(flow)).toBe(100);
  });

  it("errar manda para o fim da fila, sem avançar o progresso", () => {
    let flow = startFlow(["a", "b", "c"]);
    flow = advance(flow, false);
    expect(flow.queue).toEqual(["b", "c", "a"]);
    expect(progressOf(flow)).toBe(0);
    expect(flow.rounds.a).toBe(1);
  });

  it("o que erra volta até acertar", () => {
    let flow = startFlow(["a", "b"]);
    flow = advance(flow, false); // a errou
    flow = advance(flow, true); // b certo
    expect(currentKey(flow)).toBe("a");
    flow = advance(flow, false); // a errou de novo
    expect(isFinished(flow)).toBe(false);
    flow = advance(flow, true);
    expect(isFinished(flow)).toBe(true);
    expect(flow.done.sort()).toEqual(["a", "b"]);
    expect(flow.rounds.a).toBe(2);
  });

  it("lição sem exercícios já nasce concluída", () => {
    const flow = startFlow([]);
    expect(isFinished(flow)).toBe(true);
    expect(progressOf(flow)).toBe(100);
    expect(advance(flow, true)).toBe(flow);
  });
});

describe("seededShuffle", () => {
  it("é estável e preserva os itens", () => {
    const items = [0, 1, 2, 3, 4, 5];
    expect(seededShuffle(items, "q1:0")).toEqual(seededShuffle(items, "q1:0"));
    expect(seededShuffle(items, "q1:0").sort()).toEqual(items);
    expect(items).toEqual([0, 1, 2, 3, 4, 5]); // não muda o original
  });

  it("outra rodada dá outra ordem", () => {
    const items = [0, 1, 2, 3, 4, 5];
    const orders = new Set(["q1:0", "q1:1", "q1:2", "q1:3"].map((seed) => seededShuffle(items, seed).join()));
    expect(orders.size).toBeGreaterThan(1);
  });
});
