import Link from "next/link";
import { BookCover, LevelChip } from "@/components/library/book-card";
import { CountChips } from "@/components/anki/count-chips";
import { Mascot } from "@/components/mascot";
import { ContinueCard } from "@/components/trail/continue-card";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GoalBar } from "@/components/goal/goal-dashboard";
import { Progress } from "@/components/ui/progress";
import { formatDay, formatMinutes, statusInfo, todayMessage } from "@/lib/goal-format";
import type { GoalOverview } from "@/lib/goal-types";
import { itemDetail } from "@/lib/checklist-format";
import type { ChecklistToday } from "@/lib/checklist-types";
import { cn } from "@/lib/cn";
import { ItemBody } from "@/components/motivation/item-body";
import type { MotivationItem } from "@/lib/motivation-types";
import type { Book } from "@/lib/book-types";
import { levelName } from "@/lib/trail-types";
import type { AnkiToday, Step } from "@/lib/dashboard";
import type { QuestionSummary } from "@/lib/interview-types";
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
    { href: "/meta", label: "Minha meta", icon: "🎯" },
    { href: "/entrevista", label: "Preparar entrevista", icon: "💬" },
    { href: "/anki/estatisticas", label: "Estatísticas do Anki", icon: "📈" },
    { href: "/anki/cartoes", label: "Meus cartões", icon: "🗂️" },
    { href: "/anki/importar", label: "Importar baralho", icon: "📥" },
    ...(hasPlacement ? [{ href: "/nivelamento", label: "Refazer teste de nível", icon: "📏" }] : []),
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

/** A meta no painel: o caminho percorrido, o prazo e o que falta hoje (ou o convite para criar uma). */
export function GoalCard({ overview }: { overview: GoalOverview }) {
  const { goal, plan } = overview;
  if (!goal || !plan) {
    return (
      <Card tone="lavender" className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
        <div className="max-w-xl">
          <h2 className="font-display text-2xl font-semibold">🌎 Qual é a sua meta?</h2>
          <p className="mt-2 text-pretty">
            Quer trabalhar no exterior? Escolha o nível e a data e veja quanto estudar por dia, com uma barra de progresso até o seu objetivo.
          </p>
        </div>
        <ButtonLink href="/meta" variant="ghost" className="shrink-0">
          Definir minha meta
        </ButtonLink>
      </Card>
    );
  }

  const status = statusInfo(plan.status);
  return (
    <Card tone="lavender" className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-bold text-muted">🌎 Rumo a trabalhar no exterior</p>
          <h2 className="mt-1 font-display text-2xl leading-tight font-semibold text-balance">{goal.motivation || `Chegar ao ${goal.targetLevel}`}</h2>
          <p className="text-muted">
            {goal.startLevel} → {goal.targetLevel} até {formatDay(goal.targetDay)}
          </p>
        </div>
        <p className="font-display text-5xl leading-none font-semibold tabular-nums">{plan.percent}%</p>
      </div>
      <GoalBar percent={plan.percent} timePercent={plan.timePercent} className="mt-2" />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <p className="text-pretty">
          <span aria-hidden>{status.icon}</span> <strong>{status.title}.</strong>{" "}
          <span className="text-muted">
            {plan.status === "done" ? todayMessage(plan) : `${todayMessage(plan)} Faltam ${plan.daysLeft} dias · meta de ${formatMinutes(plan.dailyTargetMinutes)} por dia.`}
          </span>
        </p>
        <ButtonLink href="/meta" variant="ghost">
          Ver minha meta
        </ButtonLink>
      </div>
    </Card>
  );
}

/** O checklist de hoje no painel: o que já foi feito, o que falta e a faixa dos últimos dias. */
export function TodayCard({ data }: { data: ChecklistToday }) {
  const { summary, streak, strip } = data;
  const pending = data.items.filter((item) => item.enabled && !item.done);
  return (
    <Card tone="primary" className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-bold text-muted">✅ Checklist de hoje</p>
          <h2 className="mt-1 font-display text-2xl leading-tight font-semibold text-balance">
            {summary.complete ? "Dia completo! 🎉" : `${summary.done} de ${summary.total} feitos`}
          </h2>
          <p className="text-muted">
            🔥 {streak.current} {streak.current === 1 ? "dia completo seguido" : "dias completos seguidos"}
          </p>
        </div>
        <p className="font-display text-5xl leading-none font-semibold tabular-nums">{summary.percent}%</p>
      </div>
      <Progress value={summary.percent} label="Progresso do checklist de hoje" className="mt-3" />
      {pending.length > 0 && (
        <ul className="mt-4 flex flex-col gap-1.5">
          {pending.slice(0, 4).map((item) => {
            const detail = itemDetail(item);
            return (
              <li key={item.key} className="flex items-baseline gap-2">
                <span aria-hidden className="text-muted">○</span>
                <span className="font-semibold">{item.label}</span>
                {detail && <span className="text-sm text-muted">{detail}</span>}
              </li>
            );
          })}
          {pending.length > 4 && <li className="text-sm text-muted">e mais {pending.length - 4}</li>}
        </ul>
      )}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <ol className="flex gap-1" aria-hidden>
          {strip.slice(-7).map((day) => (
            <li key={day.day} className={cn("size-3.5 rounded-full", day.complete ? "bg-primary-edge" : day.percent > 0 ? "bg-butter" : "bg-surface-soft")} />
          ))}
        </ol>
        <ButtonLink href="/hoje" variant="ghost">
          Abrir o checklist
        </ButtonLink>
      </div>
    </Card>
  );
}

/** Um item aleatório do mural de motivação (ou o convite para criar o primeiro). */
export function MotivationCard({ item }: { item: MotivationItem | null }) {
  return (
    <Card tone="lavender" className="flex h-full flex-col gap-4 p-6">
      <p className="text-sm font-bold text-muted">💪 Seu motivo para continuar</p>
      {item ? (
        <ItemBody item={item} />
      ) : (
        <p className="text-pretty">
          Guarde frases, imagens, vídeos e áudios com a sua própria voz para ouvir nos dias difíceis. Comece com uma frase que te faça seguir em frente.
        </p>
      )}
      <div className="mt-auto">
        <ButtonLink href="/motivacao" variant="ghost">
          {item ? "Abrir meu mural" : "Criar meu mural"}
        </ButtonLink>
      </div>
    </Card>
  );
}


/** O que fazer agora: um passo em destaque, com o botão certo, e os próximos logo abaixo. */
export function NextStepCard({ steps }: { steps: Step[] }) {
  if (steps.length === 0) {
    return (
      <Card tone="primary" className="flex flex-wrap items-center gap-5 p-6 md:p-8">
        <span aria-hidden className="grid size-16 shrink-0 place-items-center rounded-3xl bg-surface text-4xl">
          🎉
        </span>
        <div className="min-w-0 flex-1 basis-64">
          <h2 className="font-display text-3xl font-semibold text-balance">Tudo feito por hoje!</h2>
          <p className="mt-1 text-lg text-muted text-pretty">Seu checklist está em dia. Se quiser ir além, que tal ler um pouco ou praticar uma pergunta de entrevista?</p>
        </div>
        <ButtonLink href="/hoje" variant="ghost">
          Ver o checklist
        </ButtonLink>
      </Card>
    );
  }

  const [main, ...rest] = steps;
  return (
    <Card tone="primary" className="flex flex-col gap-5 p-6 md:p-8">
      <div className="flex flex-wrap items-center gap-5">
        <span aria-hidden className="grid size-16 shrink-0 place-items-center rounded-3xl bg-surface text-4xl">
          {main.icon}
        </span>
        <div className="min-w-0 flex-1 basis-64">
          <p className="text-sm font-bold tracking-wide text-muted uppercase">Seu próximo passo</p>
          <h2 className="mt-1 font-display text-3xl leading-tight font-semibold text-balance">{main.title}</h2>
          <p className="mt-1 text-pretty text-muted" lang={main.key === "interview" ? "en" : undefined}>
            {main.detail}
            {main.minutes !== null && <span className="font-semibold"> · cerca de {main.minutes} min</span>}
          </p>
        </div>
        <ButtonLink href={main.href} size="lg">
          {main.cta}
        </ButtonLink>
      </div>

      {rest.length > 0 && (
        <div className="border-t-2 border-primary/20 pt-4">
          <p className="text-sm font-bold text-muted">Depois, se der</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {rest.slice(0, 4).map((step) => (
              <li key={step.key}>
                <Link
                  href={step.href}
                  className="inline-flex items-center gap-2 rounded-pill border-2 border-border bg-surface px-4 py-2 text-sm font-bold transition-colors hover:border-primary hover:bg-surface-soft"
                >
                  <span aria-hidden>{step.icon}</span>
                  {step.key === "anki" ? "Anki" : step.key === "lesson" ? "Lição" : step.key === "reading" ? "Leitura" : step.key === "interview" ? "Entrevista" : step.key === "diary" ? "Diário" : step.title}
                  {step.minutes !== null && <span className="font-medium text-muted">{step.minutes} min</span>}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

/** Entrevista no painel: quantas perguntas já foram, a nota média e a sugestão do momento. */
export function InterviewCard({
  summary,
  suggestion,
}: {
  summary: { total: number; answered: number; average: number | null; toReview: number };
  suggestion: QuestionSummary | null;
}) {
  const percent = summary.total ? Math.round((summary.answered / summary.total) * 100) : 0;
  return (
    <Card tone="coral" className="flex h-full flex-col justify-between gap-5">
      <div>
        <h2 className="font-display text-2xl font-semibold">Entrevista</h2>
        <p className="mt-2">
          <span className="font-display text-5xl leading-none font-semibold tabular-nums">{summary.answered}</span>{" "}
          <span className="font-bold">de {summary.total} perguntas respondidas</span>
        </p>
        <Progress value={percent} label="Perguntas de entrevista respondidas" className="mt-3 h-3" />
        <p className="mt-2 text-sm font-semibold text-muted">
          {summary.average !== null ? `Nota média ${summary.average.toLocaleString("pt-BR")}/5` : "Responda a primeira para ver sua nota"}
          {summary.toReview > 0 && ` · ${summary.toReview} para revisar`}
        </p>
        {suggestion && (
          <p className="mt-3 text-pretty">
            <span className="text-sm font-bold text-muted">Sugestão: </span>
            <span lang="en">{suggestion.question}</span>
          </p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <ButtonLink href={suggestion ? `/entrevista/${suggestion.slug}` : "/entrevista"} variant="coral">
          {suggestion ? "Praticar agora" : "Abrir as perguntas"}
        </ButtonLink>
        <Link href="/entrevista/simulado" className="font-bold underline-offset-4 hover:underline">
          Fazer um simulado
        </Link>
      </div>
    </Card>
  );
}
