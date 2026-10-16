export const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
export type Level = (typeof LEVELS)[number];

export const LEVEL_NAME: Record<Level, string> = {
  A1: "Iniciante",
  A2: "Básico",
  B1: "Intermediário",
  B2: "Intermediário+",
  C1: "Avançado",
  C2: "Proficiente",
};

/** Cor de cada nível (mesma ordem de cores da trilha na página inicial). */
export const LEVEL_STYLE: Record<Level, { chip: string; tile: string }> = {
  A1: { chip: "bg-primary-soft", tile: "bg-primary text-on-primary" },
  A2: { chip: "bg-sky-soft", tile: "bg-sky text-ink" },
  B1: { chip: "bg-butter-soft", tile: "bg-butter text-ink" },
  B2: { chip: "bg-coral-soft", tile: "bg-coral text-ink" },
  C1: { chip: "bg-lavender-soft", tile: "bg-lavender text-ink" },
  C2: { chip: "bg-primary-soft", tile: "bg-primary text-on-primary" },
};

export type Book = {
  id: string;
  title: string;
  author: string | null;
  description: string | null;
  level: Level;
  status: "PENDING" | "READY";
  pageCount: number | null;
  sizeBytes: number | null;
  coverUrl: string | null;
  progress: { page: number; totalPages: number | null; updatedAt: string } | null;
  createdAt: string;
};

/** Formulário de upload direto ao bucket (POST pré-assinado). */
export type PresignedUpload = { url: string; fields: Record<string, string> };

export type CreatedBook = {
  book: Book;
  upload: { file: PresignedUpload; cover: PresignedUpload };
};
