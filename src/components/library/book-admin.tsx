"use client";

import { useRef, useState, type FormEvent } from "react";
import { BookCover, LevelChip } from "@/components/library/book-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Progress } from "@/components/ui/progress";
import { api, ApiError } from "@/lib/api-client";
import { postToBucket } from "@/lib/bucket-upload";
import { LEVELS, LEVEL_NAME, type Book, type CreatedBook, type Level } from "@/lib/book-types";
import { cn } from "@/lib/cn";
import { readPdfInfo } from "@/lib/pdf";

const MAX_MB = 150;

const SELECT =
  "h-12 rounded-2xl border-2 border-border bg-surface px-4 text-base hover:border-sky focus-visible:border-sky focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky/30";

function megabytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;
}

type Stage = "idle" | "reading" | "uploading" | "verifying";

const STAGE_LABEL: Record<Exclude<Stage, "idle">, string> = {
  reading: "Lendo o PDF…",
  uploading: "Enviando o livro…",
  verifying: "Conferindo o arquivo…",
};

export function BookAdmin({ initialBooks }: { initialBooks: Book[] }) {
  const [books, setBooks] = useState(initialBooks);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [level, setLevel] = useState<Level>("A2");
  const [stage, setStage] = useState<Stage>("idle");
  const [percent, setPercent] = useState(0);
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const busy = stage !== "idle";

  async function reload() {
    const result = await api<{ books: Book[] }>("/books?includePending=true");
    setBooks(result.books);
  }

  function choose(next: File | undefined) {
    setError(undefined);
    setSuccess(undefined);
    if (!next) return setFile(null);
    if (next.size > MAX_MB * 1024 * 1024) {
      setFile(null);
      return setError(`O arquivo tem ${megabytes(next.size)}; o limite é ${MAX_MB} MB.`);
    }
    setFile(next);
    if (!title.trim()) setTitle(next.name.replace(/\.pdf$/i, "").replace(/[_-]+/g, " ").trim());
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!file) return;
    setError(undefined);
    setSuccess(undefined);
    setFieldErrors({});
    setPercent(0);

    let createdId: string | null = null;
    try {
      setStage("reading");
      const info = await readPdfInfo(file);

      const created = await api<CreatedBook>("/books", {
        method: "POST",
        body: { title, author: author || undefined, level, sizeBytes: file.size },
      });
      createdId = created.book.id;

      setStage("uploading");
      await postToBucket(created.upload.file, file, "application/pdf", "book.pdf", setPercent);
      // a capa é opcional: se falhar, o livro ainda é liberado, só que sem imagem
      if (info.cover) {
        await postToBucket(created.upload.cover, info.cover, "image/jpeg", "cover.jpg").catch(() => undefined);
      }

      setStage("verifying");
      await api(`/books/${createdId}/confirm`, { method: "POST", body: { pageCount: info.pageCount } });
      createdId = null;

      setSuccess(`“${title}” foi publicado (${info.pageCount} páginas).`);
      setFile(null);
      setTitle("");
      setAuthor("");
      if (input.current) input.current.value = "";
      await reload();
    } catch (e) {
      if (e instanceof ApiError && e.errors.length > 0) {
        setFieldErrors(Object.fromEntries(e.errors.map((item) => [item.field, item.message])));
      } else {
        setError(
          e instanceof ApiError
            ? e.message
            : e instanceof Error && e.name === "InvalidPDFException"
              ? "Este arquivo não parece ser um PDF válido."
              : e instanceof Error
                ? e.message
                : "Algo deu errado no envio.",
        );
      }
      // não deixa um registro "pendente" para trás
      if (createdId) await api(`/books/${createdId}`, { method: "DELETE" }).catch(() => undefined);
      await reload().catch(() => undefined);
    } finally {
      setStage("idle");
    }
  }

  async function remove(book: Book) {
    if (!window.confirm(`Apagar “${book.title}”? O arquivo e o progresso de leitura de todos serão removidos.`)) return;
    try {
      await api(`/books/${book.id}`, { method: "DELETE" });
      setBooks((current) => current.filter((item) => item.id !== book.id));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Não consegui apagar.");
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr] lg:items-start">
      <section aria-labelledby="upload-title">
        <Card tone="butter">
          <h2 id="upload-title" className="font-display text-2xl font-semibold">
            Enviar livro
          </h2>
          <form onSubmit={submit} className="mt-5 flex flex-col gap-4">
            <label
              htmlFor="book-file"
              className="flex cursor-pointer flex-col items-center gap-1 rounded-2xl border-2 border-dashed border-border bg-surface px-4 py-6 text-center transition-colors hover:border-sky"
            >
              <span aria-hidden className="text-3xl">
                📚
              </span>
              {file ? (
                <>
                  <span className="break-all font-display text-lg font-semibold">{file.name}</span>
                  <span className="text-sm text-muted">{megabytes(file.size)} · clique para trocar</span>
                </>
              ) : (
                <>
                  <span className="font-display text-lg font-semibold">Escolha o PDF</span>
                  <span className="text-sm text-muted">até {MAX_MB} MB</span>
                </>
              )}
              <input
                ref={input}
                id="book-file"
                type="file"
                accept="application/pdf,.pdf"
                disabled={busy}
                onChange={(event) => choose(event.target.files?.[0])}
                className="sr-only"
              />
            </label>

            <Field id="book-title" label="Título" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} disabled={busy} error={fieldErrors.title} />
            <Field id="book-author" label="Autor (opcional)" value={author} onChange={(e) => setAuthor(e.target.value)} maxLength={120} disabled={busy} />

            <label className="flex flex-col gap-1.5 font-display text-base font-semibold">
              Nível
              <select value={level} onChange={(e) => setLevel(e.target.value as Level)} disabled={busy} className={cn(SELECT, "font-sans font-normal")}>
                {LEVELS.map((option) => (
                  <option key={option} value={option}>
                    {option} · {LEVEL_NAME[option]}
                  </option>
                ))}
              </select>
            </label>

            {busy && (
              <div role="status" aria-live="polite">
                <p className="text-sm font-semibold">{STAGE_LABEL[stage as Exclude<Stage, "idle">]}</p>
                {stage === "uploading" && <Progress value={percent} label="Progresso do envio" className="mt-2" />}
              </div>
            )}
            <p role="alert" className="min-h-5 text-sm font-semibold text-coral-edge">
              {error}
            </p>
            {success && (
              <p role="status" className="text-sm font-semibold text-primary">
                {success}
              </p>
            )}

            <Button type="submit" disabled={busy || !file || !title.trim()}>
              {busy ? "Enviando…" : "Publicar livro"}
            </Button>
          </form>
        </Card>
      </section>

      <section aria-labelledby="books-title">
        <h2 id="books-title" className="font-display text-2xl font-semibold">
          Livros ({books.length})
        </h2>
        {books.length === 0 ? (
          <p className="mt-4 rounded-card border-2 border-dashed border-border px-6 py-10 text-center text-muted">
            Nenhum livro enviado ainda.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {books.map((book) => (
              <li key={book.id}>
                <Card className="flex gap-4 p-4">
                  <BookCover book={book} className="w-16 shrink-0 shadow-none" />
                  <div className="min-w-0 flex-1">
                    {editingId === book.id ? (
                      <EditBook
                        book={book}
                        onCancel={() => setEditingId(null)}
                        onSaved={(saved) => {
                          setBooks((current) => current.map((item) => (item.id === saved.id ? { ...item, ...saved } : item)));
                          setEditingId(null);
                        }}
                      />
                    ) : (
                      <>
                        <div className="flex flex-wrap items-center gap-2">
                          <LevelChip level={book.level} />
                          {book.status === "PENDING" && (
                            <span className="rounded-pill bg-coral-soft px-2.5 py-0.5 text-xs font-bold">Envio incompleto</span>
                          )}
                        </div>
                        <p className="mt-1 font-display text-lg font-semibold leading-snug">{book.title}</p>
                        <p className="text-sm text-muted">
                          {[book.author, book.pageCount ? `${book.pageCount} páginas` : null, book.sizeBytes ? megabytes(book.sizeBytes) : null]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                        <div className="mt-2 flex gap-1">
                          <button
                            type="button"
                            onClick={() => setEditingId(book.id)}
                            className="rounded-pill px-3 py-1 text-sm font-semibold text-muted transition-colors hover:bg-sky-soft hover:text-foreground"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => void remove(book)}
                            className="rounded-pill px-3 py-1 text-sm font-semibold text-muted transition-colors hover:bg-coral-soft hover:text-foreground"
                          >
                            Apagar
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function EditBook({ book, onSaved, onCancel }: { book: Book; onSaved: (book: Book) => void; onCancel: () => void }) {
  const [title, setTitle] = useState(book.title);
  const [author, setAuthor] = useState(book.author ?? "");
  const [level, setLevel] = useState<Level>(book.level);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  async function save(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(undefined);
    try {
      const { book: saved } = await api<{ book: Book }>(`/books/${book.id}`, {
        method: "PATCH",
        body: { title, author, level },
      });
      onSaved(saved);
    } catch (e) {
      setError(e instanceof ApiError ? (e.errors[0]?.message ?? e.message) : "Não consegui salvar.");
    } finally {
      setPending(false);
    }
  }

  const id = `edit-book-${book.id}`;
  return (
    <form onSubmit={save} className="flex flex-col gap-3">
      <Field id={`${id}-title`} label="Título" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
      <Field id={`${id}-author`} label="Autor" value={author} onChange={(e) => setAuthor(e.target.value)} maxLength={120} />
      <label className="flex flex-col gap-1.5 font-display text-base font-semibold">
        Nível
        <select value={level} onChange={(e) => setLevel(e.target.value as Level)} className={cn(SELECT, "font-sans font-normal")}>
          {LEVELS.map((option) => (
            <option key={option} value={option}>
              {option} · {LEVEL_NAME[option]}
            </option>
          ))}
        </select>
      </label>
      <p role="alert" className="min-h-5 text-sm font-semibold text-coral-edge">
        {error}
      </p>
      <div className="flex gap-3">
        <Button type="submit" disabled={pending || !title.trim()}>
          {pending ? "Salvando…" : "Salvar"}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={pending}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
