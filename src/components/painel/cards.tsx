import Link from "next/link";
import { BookCover, LevelChip } from "@/components/library/book-card";
import { CountChips } from "@/components/anki/count-chips";
import { Mascot } from "@/components/mascot";
import { ContinueCard } from "@/components/trail/continue-card";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { Book } from "@/lib/book-types";
import { levelName } from "@/lib/trail-types";
import type { AnkiToday } from "@/lib/dashboard";
import { readingPercent } from "@/lib/dashboard";
import type { NextLesson } from "@/lib/trail-view";

/** Próxima lição + a barra do nível em que ela está. */
export function TrailCard({
  next,
  started,
  progress,
}: {
  next: NextLesson | null;
  started: boolean;
  progress: { level: NextLesson["level"]; done: number; total: number; percent: number } | null;
}) {
  return (
    <div className="flex h-full flex-col gap-3">
      <ContinueCard next={next} started={started} />
      {progress && (
        <div className="rounded-card border-2 border-border bg-surface px-5 py-4">
          <div className="flex items-baseline justify-between gap-3 text-sm font-bold">
            <span>
              Nível {progress.level} · {levelName(progress.level)}
            </span>
            <span className="text-muted tabular-nums">
              {progress.done} de {progress.total} lições
            </span>
          </div>
          <Progress value={progress.percent} label={`Progresso no nível ${progress.level}`} className="mt-2 h-3" />
        </div>
      )}
    </div>
  );
}

export function AnkiCard({ today }: { today: AnkiToday }) {
  if (today.decks === 0) {
    return (
      <Card tone="sky" className="flex h-full flex-col justify-between gap-5">
        <div>
          <h2 className="font-display text-2xl font-semibold">Anki</h2>
          <p className="mt-2 text-pretty">Crie um baralho ou importe o seu para treinar vocabulário com repetição espaçada.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/anki" variant="sky">
            Criar baralho
          </ButtonLink>
          <ButtonLink href="/anki/importar" variant="ghost">
            Importar
          </ButtonLink>
        </div>
      </Card>
    );
  }

  return (
    <Card tone="sky" className="flex h-full flex-col justify-between gap-5">
      <div>
        <h2 className="font-display text-2xl font-semibold">Anki</h2>
        {today.total > 0 ? (
          <>
            <p className="mt-2">
              <span className="font-display text-5xl leading-none font-semibold tabular-nums">{today.total}</span>{" "}
              <span className="font-bold">{today.total === 1 ? "cartão para hoje" : "cartões para hoje"}</span>
            </p>
            <CountChips counts={today.counts} className="mt-4" />
          </>
        ) : (
          <div className="mt-3 flex items-center gap-3">
            <span aria-hidden className="grid size-12 shrink-0 place-items-center rounded-2xl bg-surface text-2xl">
              ✓
            </span>
            <p className="text-pretty">
              <strong>Tudo em dia!</strong> Nenhum cartão esperando hoje.
            </p>
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        {today.top ? (
          <ButtonLink href={`/anki/estudar/${today.top.id}`} variant="sky">
            Estudar agora
          </ButtonLink>
        ) : null}
        <Link href="/anki" className="font-bold underline-offset-4 hover:underline">
          {today.top ? "Ver baralhos" : "Abrir o Anki"}
        </Link>
        {today.top && today.decks > 1 && <p className="w-full text-sm text-muted">Começa por “{today.top.name}”.</p>}
      </div>
    </Card>
  );
}

export function ReadingCard({ book, isAdmin }: { book: Book | null; isAdmin: boolean }) {
  if (!book) {
    return (
      <Card tone="butter" className="flex h-full flex-col justify-between gap-5">
        <div className="flex items-start gap-4">
          <Mascot className="hidden w-16 shrink-0 sm:block" />
          <div>
            <h2 className="font-display text-2xl font-semibold">Leitura</h2>
            <p className="mt-2 text-pretty">
              Leia livros em inglês e toque numa palavra para ver o significado e mandar para o Anki.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/biblioteca" variant="butter">
            Explorar a biblioteca
          </ButtonLink>
          {isAdmin && (
            <ButtonLink href="/admin/livros" variant="ghost">
              Gerenciar livros
            </ButtonLink>
          )}
        </div>
      </Card>
    );
  }

  const percent = readingPercent(book);
  const total = book.pageCount ?? book.progress?.totalPages ?? 0;
  return (
    <Card tone="butter" className="flex h-full flex-col justify-between gap-5">
      <div className="flex items-start gap-4">
        <BookCover book={book} className="w-20 shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-bold text-muted">Continue lendo</p>
          <h2 className="mt-1 font-display text-2xl leading-tight font-semibold text-balance">{book.title}</h2>
          {book.author && <p className="text-sm text-muted">{book.author}</p>}
          <LevelChip level={book.level} className="mt-2 inline-block" />
        </div>
      </div>
      <div>
        <Progress value={percent} label={`Progresso em ${book.title}`} className="h-3" />
        <p className="mt-1.5 text-sm font-semibold text-muted tabular-nums">
          Página {book.progress?.page} de {total} · {percent}%
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-3">
          <ButtonLink href={`/biblioteca/${book.id}`} variant="butter">
            Continuar
          </ButtonLink>
          <Link href="/biblioteca" className="font-bold underline-offset-4 hover:underline">
            Ver biblioteca
          </Link>
        </div>
      </div>
    </Card>
  );
}

export function PlacementInvite() {
  return (
    <aside className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-card border-2 border-lavender-edge bg-lavender-soft px-6 py-5">
      <div className="min-w-0 flex-1 basis-64">
        <p className="font-display text-xl font-semibold">Não sabe por onde começar?</p>
        <p className="mt-1 text-pretty text-muted">Faça o teste de nível (uns 10 minutos) e a trilha abre no ponto certo para você.</p>
      </div>
      <ButtonLink href="/nivelamento" variant="ghost">
        Fazer o teste
      </ButtonLink>
    </aside>
  );
}

export function Shortcuts({ isAdmin, hasPlacement }: { isAdmin: boolean; hasPlacement: boolean }) {
  const links = [
    { href: "/anki/estatisticas", label: "Estatísticas do Anki", icon: "📈" },
    { href: "/anki/cartoes", label: "Meus cartões", icon: "🗂️" },
    { href: "/anki/importar", label: "Importar baralho", icon: "📥" },
    ...(hasPlacement ? [{ href: "/nivelamento", label: "Refazer teste de nível", icon: "🎯" }] : []),
    ...(isAdmin ? [{ href: "/admin/livros", label: "Gerenciar livros", icon: "📚" }] : []),
  ];
  return (
    <nav aria-label="Atalhos" className="mt-10">
      <h2 className="font-display text-xl font-semibold">Atalhos</h2>
      <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="flex items-center gap-3 rounded-2xl border-2 border-border bg-surface px-4 py-3 font-semibold transition-colors hover:bg-surface-soft"
            >
              <span aria-hidden className="text-xl">
                {link.icon}
              </span>
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function CardSkeleton({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-label={label}
      className="h-full min-h-48 animate-pulse rounded-card border-2 border-border bg-surface-soft"
    />
  );
}
