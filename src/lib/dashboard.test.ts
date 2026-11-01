import { describe, expect, it } from "vitest";
import type { Deck } from "./anki-types";
import type { Book } from "./book-types";
import type { ChecklistItem, ChecklistToday } from "./checklist-types";
import { ankiMinutes, ankiToday, continueReading, dayMessage, greetingFor, nextSteps, readingPercent } from "./dashboard";
import type { QuestionSummary } from "./interview-types";
import type { NextLesson } from "./trail-view";

const deck = (id: string, counts: [number, number, number], parentId: string | null = null): Deck => ({
  id,
  parentId,
  name: id,
  fullName: parentId ? `raiz::${id}` : id,
  newPerDay: 20,
  reviewsPerDay: 200,
  counts: { new: counts[0], learning: counts[1], review: counts[2] },
  totalCards: 10,
});

const book = (id: string, page: number | null, total: number | null, updatedAt = "2026-10-10T10:00:00Z", status: Book["status"] = "READY"): Book => ({
  id,
  title: id,
  author: null,
  description: null,
  level: "A2",
  status,
  pageCount: total,
  sizeBytes: null,
  coverUrl: null,
  progress: page === null ? null : { page, totalPages: total, updatedAt },
  createdAt: "2026-10-01T00:00:00Z",
});

describe("greetingFor", () => {
  it("manhã, tarde e noite (inclusive de madrugada)", () => {
    expect([5, 9, 11].map(greetingFor)).toEqual(["Bom dia", "Bom dia", "Bom dia"]);
    expect([12, 15, 17].map(greetingFor)).toEqual(["Boa tarde", "Boa tarde", "Boa tarde"]);
    expect([18, 23, 0, 4].map(greetingFor)).toEqual(["Boa noite", "Boa noite", "Boa noite", "Boa noite"]);
  });
});

describe("ankiToday", () => {
  it("soma só os baralhos raiz (os subbaralhos já estão dentro) e acha o que tem mais cartões", () => {
    const result = ankiToday([deck("raiz", [3, 1, 6]), deck("sub", [3, 1, 6], "raiz"), deck("outro", [0, 0, 2])]);
    expect(result.counts).toEqual({ new: 3, learning: 1, review: 8 });
    expect(result.total).toBe(12);
    expect(result.decks).toBe(2);
    expect(result.top).toEqual({ id: "raiz", name: "raiz", due: 10 });
  });

  it("em dia ou sem baralhos: total 0 e sem baralho de destino", () => {
    expect(ankiToday([deck("a", [0, 0, 0])])).toMatchObject({ total: 0, top: null, decks: 1 });
    expect(ankiToday([])).toMatchObject({ total: 0, top: null, decks: 0 });
  });
});

describe("continueReading", () => {
  it("pega o começado e não terminado mais recente", () => {
    const books = [book("a", 10, 100, "2026-10-01T00:00:00Z"), book("b", 5, 50, "2026-10-12T00:00:00Z"), book("c", 100, 100), book("d", null, 80)];
    expect(continueReading(books)?.id).toBe("b");
  });

  it("ignora livros pendentes, terminados, sem progresso e sem total", () => {
    expect(continueReading([book("p", 3, 50, "2026-10-10T00:00:00Z", "PENDING"), book("t", 50, 50), book("n", null, 50), book("s", 3, null)])).toBeNull();
    expect(continueReading([])).toBeNull();
  });
});

describe("readingPercent", () => {
  it("percentual lido, sem passar de 100 e sem dividir por zero", () => {
    expect(readingPercent(book("a", 25, 100))).toBe(25);
    expect(readingPercent(book("b", 120, 100))).toBe(100);
    expect(readingPercent(book("c", null, 100))).toBe(0);
    expect(readingPercent(book("d", 3, null))).toBe(0);
  });
});

describe("dayMessage", () => {
  const streak = (current: number) => ({ current, longest: current, activeToday: false });
  it("muda conforme o XP de hoje e o streak", () => {
    expect(dayMessage({ todayXp: 20, streak: streak(5) })).toContain("5 dias");
    expect(dayMessage({ todayXp: 20, streak: streak(1) })).toContain("20 XP");
    expect(dayMessage({ todayXp: 0, streak: streak(3) })).toContain("manter sua sequência de 3 dias");
    expect(dayMessage({ todayXp: 0, streak: streak(1) })).toContain("1 dia");
    expect(dayMessage({ todayXp: 0, streak: streak(0) })).toContain("começar a sequência");
  });
});


const item = (key: string, done = false, enabled = true, extra: Partial<ChecklistItem> = {}): ChecklistItem => ({
  key,
  kind: "SYSTEM",
  label: key,
  href: `/${key}`,
  enabled,
  done,
  source: done ? "auto" : null,
  checked: false,
  progress: null,
  askMinutes: false,
  defaultMinutes: 0,
  minutes: null,
  ...extra,
});

const checklist = (items: ChecklistItem[]) => ({ items }) as unknown as ChecklistToday;
const lesson = { level: "A2", unit: { slug: "past", title: "Passado" }, lesson: { slug: "went", title: "Went" }, number: 1 } as unknown as NextLesson;
const interview = { slug: "closures", question: "What is a closure?" } as QuestionSummary;
const anki = ankiToday([deck("vocab", [5, 2, 3])]);

describe("nextSteps", () => {
  it("ordena: Anki, lição, leitura, entrevista, diário", () => {
    const steps = nextSteps({
      checklist: checklist([item("lesson"), item("anki"), item("reading"), item("diary"), item("interview")]),
      anki,
      lesson,
      reading: book("livro", 10, 100),
      interview,
    });
    expect(steps.map((step) => step.key)).toEqual(["anki", "lesson", "reading", "interview", "diary"]);
    expect(steps[0]).toMatchObject({ title: "Revisar 10 cartões no Anki", href: "/anki/estudar/vocab", minutes: 2 });
    expect(steps[1].href).toBe("/aprender/a2/past/went");
  });

  it("tira o que o checklist já marcou como feito ou que a pessoa desligou", () => {
    const steps = nextSteps({
      checklist: checklist([item("anki", true), item("lesson", false), item("reading", false, false), item("interview", true)]),
      anki,
      lesson,
      reading: book("livro", 10, 100),
      interview,
    });
    expect(steps.map((step) => step.key)).toEqual(["lesson"]);
  });

  it("sem checklist, sugere o que houver; sem nada, devolve vazio", () => {
    expect(nextSteps({ checklist: null, anki, lesson: null, reading: null, interview }).map((step) => step.key)).toEqual(["anki", "interview"]);
    expect(nextSteps({ checklist: null, anki: ankiToday([]), lesson: null, reading: null, interview: null })).toEqual([]);
  });

  it("inclui itens manuais e personalizados que ainda estão abertos", () => {
    const steps = nextSteps({
      checklist: checklist([item("speaking", false, true, { href: null, askMinutes: true, defaultMinutes: 10, label: "Falar em voz alta" })]),
      anki: ankiToday([]),
      lesson: null,
      reading: null,
      interview: null,
    });
    expect(steps).toEqual([expect.objectContaining({ key: "speaking", href: "/hoje", minutes: 10, cta: "Ver o checklist" })]);
  });

  it("estima o tempo do Anki: 8 s por cartão, no mínimo 1 min", () => {
    expect([1, 8, 9, 60].map(ankiMinutes)).toEqual([1, 2, 2, 8]);
  });
});
