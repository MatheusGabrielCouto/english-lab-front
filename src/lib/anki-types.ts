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
