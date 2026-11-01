import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { QuestionCard } from "@/components/interview/question-card";
import { RandomQuestionButton } from "@/components/interview/random-question-button";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { serverApi } from "@/lib/api-server";
import { cn } from "@/lib/cn";
import {
  CATEGORIES,
  DIFFICULTY,
  filterQuestions,
  overview,
  parseCategory,
  parseDifficulty,
  parseStatus,
  progressByCategory,
  searchQuestions,
  STATUS_LABEL,
  suggestQuestion,
  type QuestionStatus,
  questionStatus,
} from "@/lib/interview-format";
import type { QuestionList } from "@/lib/interview-types";

export const metadata: Metadata = { title: "Preparação para entrevista" };

export default function InterviewPage({ searchParams }: PageProps<"/entrevista">) {
  return (
    <main className="mt-4">
      <h1 className="font-display text-4xl font-semibold text-balance md:text-5xl">Preparação para entrevista</h1>
      <p className="mt-2 max-w-2xl text-lg text-muted text-pretty">
        Perguntas que caem em entrevistas de desenvolvedor no exterior. Responda em inglês e receba feedback sobre a sua gramática e sobre o conteúdo técnico.
      </p>
      <Suspense fallback={<Skeleton />}>
        <Questions searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

function Skeleton() {
  return (
    <div aria-busy="true" aria-label="Carregando as perguntas" className="mt-8 grid gap-5 sm:grid-cols-2">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="h-40 animate-pulse rounded-card bg-surface-soft" />
      ))}
    </div>
  );
}

const chip = (active: boolean) =>
  cn(
    "shrink-0 rounded-pill border-2 px-4 py-1.5 text-sm font-bold whitespace-nowrap transition-colors",
    active ? "border-foreground bg-foreground text-background" : "border-border bg-surface text-muted hover:border-sky hover:text-foreground",
  );

type Filters = { category: string | null; difficulty: 1 | 2 | 3 | null; status: QuestionStatus | null; text: string };

function href({ category, difficulty, status, text }: Filters) {
  const query = new URLSearchParams();
  if (category) query.set("categoria", category);
  if (difficulty) query.set("nivel", String(difficulty));
  if (status) query.set("situacao", status);
  if (text) query.set("busca", text);
  const result = query.toString();
  return result ? `/entrevista?${result}` : "/entrevista";
}

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div>
      <p className="font-display text-3xl leading-none font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-sm text-muted">{label}</p>
    </div>
  );
}

async function Questions({ searchParams }: { searchParams: PageProps<"/entrevista">["searchParams"] }) {
  const [{ aiEnabled, questions }, query] = await Promise.all([serverApi<QuestionList>("/api/interview/questions", "/entrevista"), searchParams]);
  const filters: Filters = {
    category: parseCategory(query.categoria),
    difficulty: parseDifficulty(query.nivel),
    status: parseStatus(query.situacao),
    text: typeof query.busca === "string" ? query.busca.trim().slice(0, 80) : "",
  };
  const { category, difficulty, status, text } = filters;
  const visible = searchQuestions(filterQuestions(questions, category, difficulty), text).filter((entry) => !status || questionStatus(entry) === status);
  const progress = progressByCategory(questions);
  const summary = overview(questions);
  const suggestion = suggestQuestion(questions);
  const filtered = Boolean(category || difficulty || status || text);

  return (
    <>
      <Card tone="lavender" className="mt-6 flex flex-col gap-5 p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-4">
            <Stat value={`${summary.answered}/${summary.total}`} label="respondidas" />
            <Stat value={summary.average === null ? "–" : `${summary.average.toLocaleString("pt-BR")}/5`} label="nota média" />
            <Stat value={summary.mastered} label="dominadas (nota 4 ou 5)" />
            <Stat value={summary.toReview} label="para revisar" />
          </div>
          <p className="text-sm font-bold text-muted">{aiEnabled ? "Feedback com IA ligado" : "Feedback por IA indisponível: revisão simples"}</p>
        </div>

        {suggestion && (
          <p className="text-pretty">
            <span className="font-bold">Sugestão para agora: </span>
            <span lang="en">{suggestion.question}</span>
            <span className="text-muted">
              {" "}
              ({questionStatus(suggestion) === "review" ? "vale revisar, sua melhor nota foi " + suggestion.bestScore + "/5" : "pergunta nova"})
            </span>
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          {suggestion && <ButtonLink href={`/entrevista/${suggestion.slug}`}>Praticar agora</ButtonLink>}
          <ButtonLink href="/entrevista/simulado" variant="sky">
            Fazer um simulado
          </ButtonLink>
          <RandomQuestionButton slugs={(filtered ? visible : questions).map((entry) => entry.slug)} />
        </div>
      </Card>

      <form action="/entrevista" method="get" role="search" className="mt-6 flex flex-wrap gap-2">
        {category && <input type="hidden" name="categoria" value={category} />}
        {difficulty && <input type="hidden" name="nivel" value={difficulty} />}
        {status && <input type="hidden" name="situacao" value={status} />}
        <label className="sr-only" htmlFor="busca">
          Buscar pergunta
        </label>
        <input
          id="busca"
          name="busca"
          type="search"
          defaultValue={text}
          maxLength={80}
          placeholder="Buscar por palavra: closure, REST, team…"
          className="h-11 min-w-0 flex-1 rounded-2xl border-2 border-border bg-surface px-4 text-base hover:border-sky focus-visible:border-sky focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky/30"
        />
        <button type="submit" className="h-11 rounded-2xl border-2 border-border bg-surface px-5 font-bold hover:border-sky">
          Buscar
        </button>
      </form>

      <nav aria-label="Categorias" className="-mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Link href={href({ ...filters, category: null })} className={chip(category === null)} aria-current={category === null ? "true" : undefined}>
          Todas
        </Link>
        {CATEGORIES.map((entry) => {
          const stats = progress.get(entry.slug);
          return (
            <Link key={entry.slug} href={href({ ...filters, category: entry.slug })} className={chip(category === entry.slug)} aria-current={category === entry.slug ? "true" : undefined}>
              <span aria-hidden>{entry.emoji}</span> {entry.title}
              {stats && <span className="ml-1.5 opacity-70 tabular-nums">{stats.answered}/{stats.total}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Dificuldade">
        <Link href={href({ ...filters, difficulty: null })} className={chip(difficulty === null)}>
          Qualquer nível
        </Link>
        {([1, 2, 3] as const).map((value) => (
          <Link key={value} href={href({ ...filters, difficulty: value })} className={chip(difficulty === value)}>
            {DIFFICULTY[value]}
          </Link>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Situação">
        <Link href={href({ ...filters, status: null })} className={chip(status === null)}>
          Qualquer situação
        </Link>
        {(["new", "review", "learning", "mastered"] as const).map((value) => (
          <Link key={value} href={href({ ...filters, status: value })} className={chip(status === value)}>
            {STATUS_LABEL[value]}
          </Link>
        ))}
      </div>

      <p className="mt-5 text-sm text-muted" aria-live="polite">
        {filtered ? `${visible.length} de ${questions.length} perguntas` : `${questions.length} perguntas`}
        {filtered && (
          <>
            {" · "}
            <Link href="/entrevista" className="font-bold underline underline-offset-4">
              limpar filtros
            </Link>
          </>
        )}
      </p>

      {visible.length === 0 ? (
        <p className="mt-10 text-center text-lg text-muted">Nenhuma pergunta com esses filtros.</p>
      ) : (
        <ul className="mt-3 grid gap-5 sm:grid-cols-2">
          {visible.map((entry) => (
            <li key={entry.slug}>
              <QuestionCard question={entry} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
