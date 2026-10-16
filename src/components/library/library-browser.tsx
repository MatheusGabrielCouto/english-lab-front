"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BookCard, BookCover, LevelChip } from "@/components/library/book-card";
import { Mascot } from "@/components/mascot";
import { ButtonLink } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { LEVELS, LEVEL_NAME, type Book, type Level } from "@/lib/book-types";
import { cn } from "@/lib/cn";

const CONTROL =
  "h-12 w-full rounded-2xl border-2 border-border bg-surface px-4 text-base placeholder:text-muted/70 hover:border-sky focus-visible:border-sky focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky/30";

export function LibraryBrowser({ books, isAdmin }: { books: Book[]; isAdmin: boolean }) {
  const [level, setLevel] = useState<Level | "">("");
  const [query, setQuery] = useState("");

  const counts = useMemo(() => {
    const result = new Map<Level, number>();
    for (const book of books) result.set(book.level, (result.get(book.level) ?? 0) + 1);
    return result;
  }, [books]);

  // quem já começou um livro e ainda não terminou, do mais recente para o mais antigo
  const reading = useMemo(
    () =>
      books
        .filter((book) => book.progress && book.pageCount && book.progress.page < book.pageCount)
        .sort((a, b) => +new Date(b.progress!.updatedAt) - +new Date(a.progress!.updatedAt))
        .slice(0, 3),
    [books],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return books.filter(
      (book) =>
        (!level || book.level === level) &&
        (!q || `${book.title} ${book.author ?? ""}`.toLowerCase().includes(q)),
    );
  }, [books, level, query]);

  const filtering = Boolean(level || query.trim());

  if (books.length === 0) {
    return (
      <div className="mx-auto mt-12 flex max-w-sm flex-col items-center text-center">
        <Mascot className="w-40 motion-safe:animate-float" />
        <h2 className="mt-4 font-display text-2xl font-semibold">A estante está vazia</h2>
        <p className="mt-2 text-muted text-pretty">
          {isAdmin ? "Envie o primeiro livro em PDF para começar." : "Em breve haverá livros por aqui."}
        </p>
        {isAdmin && (
          <ButtonLink href="/admin/livros" className="mt-5">
            Enviar um livro
          </ButtonLink>
        )}
      </div>
    );
  }

  return (
    <div>
      {!filtering && reading.length > 0 && (
        <section aria-labelledby="continue" className="mb-10">
          <h2 id="continue" className="font-display text-2xl font-semibold">
            Continue lendo
          </h2>
          <ul className="mt-4 grid gap-4 md:grid-cols-3">
            {reading.map((book) => {
              const percent = Math.round((book.progress!.page / book.pageCount!) * 100);
              return (
                <li key={book.id}>
                  <Link
                    href={`/biblioteca/${book.id}`}
                    className="flex items-center gap-4 rounded-card border-2 border-border bg-surface p-3 shadow-[0_4px_0_0_var(--color-border)] transition-transform duration-200 ease-out hover:-translate-y-0.5"
                  >
                    <BookCover book={book} className="w-16 shrink-0 shadow-none" />
                    <div className="min-w-0 flex-1">
                      <LevelChip level={book.level} />
                      <p className="mt-1 truncate font-display text-lg font-semibold">{book.title}</p>
                      <Progress value={percent} label={`Progresso em ${book.title}`} className="mt-2 h-2.5" />
                      <p className="mt-1 text-xs font-semibold text-muted">
                        Página {book.progress!.page} de {book.pageCount} · {percent}%
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Filtros: uma linha acima dos livros */}
      <section aria-label="Filtros" className="flex flex-col gap-4">
        <div>
          <label htmlFor="book-search" className="sr-only">
            Buscar livros
          </label>
          <input
            id="book-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por título ou autor…"
            className={CONTROL}
          />
        </div>
        <div role="group" aria-label="Nível" className="flex flex-wrap gap-2">
          <LevelButton active={level === ""} onClick={() => setLevel("")}>
            Todos <span className="opacity-70">{books.length}</span>
          </LevelButton>
          {LEVELS.map((option) => {
            const count = counts.get(option) ?? 0;
            return (
              <LevelButton
                key={option}
                active={level === option}
                disabled={count === 0}
                onClick={() => setLevel(option)}
                title={LEVEL_NAME[option]}
              >
                {option} <span className="opacity-70">{count}</span>
              </LevelButton>
            );
          })}
        </div>
      </section>

      {visible.length === 0 ? (
        <p className="mt-8 rounded-card border-2 border-dashed border-border px-6 py-10 text-center text-muted">
          Nenhum livro encontrado. Tente outro nível ou outra palavra.
        </p>
      ) : (
        <ul className="mt-6 grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-3 lg:grid-cols-4">
          {visible.map((book) => (
            <li key={book.id}>
              <BookCard book={book} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function LevelButton({
  active,
  children,
  ...props
}: { active: boolean } & React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        "rounded-pill border-2 px-4 py-1.5 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        active
          ? "border-foreground bg-foreground text-background"
          : "border-border bg-surface text-muted hover:border-sky hover:text-foreground disabled:hover:border-border disabled:hover:text-muted",
      )}
      {...props}
    >
      {children}
    </button>
  );
}
