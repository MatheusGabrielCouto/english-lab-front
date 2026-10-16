export type NoteType = "BASIC" | "BASIC_REVERSED" | "CLOZE";

/** Trecho de um cartão; sempre renderizado como texto puro. */
export type Part = {
  text: string;
  /** lacuna ainda escondida */
  hidden?: boolean;
  /** resposta da lacuna ativa */
  highlight?: boolean;
};

export type Rating = 1 | 2 | 3 | 4;

export type DeckCounts = { new: number; learning: number; review: number };

export type Deck = {
  id: string;
  parentId: string | null;
  name: string;
  fullName: string;
  newPerDay: number;
  reviewsPerDay: number;
  counts: DeckCounts;
  totalCards: number;
};

export type StudyCard = {
  id: string;
  noteType: NoteType;
  /** 0 New, 1 Learning, 2 Review, 3 Relearning */
  state: number;
  question: Part[];
  answer: Part[];
  extra?: string;
  /** rótulo de quanto tempo até o cartão voltar, por resposta */
  intervals: Record<Rating, string>;
};

export type StudyState = {
  counts: DeckCounts;
  card: StudyCard | null;
  nextDueAt: string | null;
};

export type NoteFields = {
  front?: string;
  back?: string;
  text?: string;
  extra?: string;
};

export type Note = {
  id: string;
  deckId: string;
  type: NoteType;
  fields: NoteFields;
  tags: string[];
  createdAt: string;
  cardCount: number;
};

export type NotesPage = { notes: Note[]; nextCursor: string | null };

export const NOTE_TYPE_LABEL: Record<NoteType, string> = {
  BASIC: "Básico",
  BASIC_REVERSED: "Básico + invertido",
  CLOZE: "Lacuna (cloze)",
};

/** Nota nos resultados de busca: inclui o baralho e a situação dos cartões. */
export type SearchedNote = Note & {
  deckName: string;
  suspendedCards: number;
  states: { new: number; learning: number; review: number };
};

export type SearchPage = { notes: SearchedNote[]; nextCursor: string | null };

export type StatsDay = { date: string; reviews: number; correct: number; minutes: number };

export type Stats = {
  deckId: string | null;
  days: number;
  today: { reviews: number; correct: number; minutes: number };
  streak: number;
  allTime: { reviews: number; minutes: number; activeDays: number };
  retention: { rate: number | null; sample: number };
  history: StatsDay[];
  forecast: { date: string; due: number }[];
  cards: {
    total: number;
    new: number;
    learning: number;
    young: number;
    mature: number;
    suspended: number;
  };
};

export type ImportSummary = {
  deckId: string | null;
  decksCreated: number;
  notesImported: number;
  cardsCreated: number;
  skippedDuplicates: number;
  skippedInvalid: number;
  ignoredMedia: number;
  truncated: number;
};
