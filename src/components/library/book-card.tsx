import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { LEVEL_NAME, LEVEL_STYLE, type Book } from "@/lib/book-types";
import { cn } from "@/lib/cn";

/** Capa do livro; sem imagem, um bloco colorido com a inicial e o nível. */
export function BookCover({ book, className }: { book: Pick<Book, "title" | "level" | "coverUrl">; className?: string }) {
  return (
    <div
      className={cn(
        "relative aspect-[2/3] overflow-hidden rounded-2xl border-2 border-border bg-surface-soft shadow-[0_4px_0_0_var(--color-border)]",
        className,
      )}
    >
      {book.coverUrl ? (
        // capa vem do bucket por link temporário; next/image não ajuda com URLs assinadas
        // eslint-disable-next-line @next/next/no-img-element
        <img src={book.coverUrl} alt="" loading="lazy" className="size-full object-cover" />
      ) : (
        <div className={cn("flex size-full flex-col items-center justify-center gap-2 p-4 text-center", LEVEL_STYLE[book.level].tile)}>
          <span aria-hidden className="font-display text-6xl font-semibold leading-none">
            {book.title.charAt(0).toUpperCase()}
          </span>
          <span className="line-clamp-3 font-display text-sm font-semibold opacity-90">{book.title}</span>
        </div>
      )}
    </div>
  );
}

export function LevelChip({ level, className }: { level: Book["level"]; className?: string }) {
  return (
    <span className={cn("rounded-pill px-2.5 py-0.5 text-xs font-bold text-foreground", LEVEL_STYLE[level].chip, className)}>
      {level} · {LEVEL_NAME[level]}
    </span>
  );
}

export function BookCard({ book }: { book: Book }) {
  const page = book.progress?.page ?? 0;
  const total = book.pageCount ?? book.progress?.totalPages ?? 0;
  const percent = total ? Math.round((page / total) * 100) : 0;
  const started = page > 1 || percent > 0;

  return (
    <Link
      href={`/biblioteca/${book.id}`}
      className="group flex h-full flex-col gap-3 rounded-card p-2 transition-colors hover:bg-surface-soft"
    >
      <BookCover book={book} className="transition-transform duration-200 ease-out group-hover:-translate-y-1" />
      <div className="flex flex-1 flex-col gap-1.5 px-1">
        <LevelChip level={book.level} className="self-start" />
        <h3 className="font-display text-lg font-semibold leading-snug text-balance">{book.title}</h3>
        {book.author && <p className="text-sm text-muted">{book.author}</p>}
        <div className="mt-auto pt-2">
          {started && total > 0 ? (
            <>
              <Progress value={percent} label={`Progresso em ${book.title}`} className="h-2.5" />
              <p className="mt-1.5 text-xs font-semibold text-muted">
                Página {page} de {total} · {percent}%
              </p>
            </>
          ) : (
            <p className="text-xs font-semibold text-muted">{total ? `${total} páginas` : "Pronto para ler"}</p>
          )}
        </div>
      </div>
    </Link>
  );
}
