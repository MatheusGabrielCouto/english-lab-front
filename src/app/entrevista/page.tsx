import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { QuestionCard } from "@/components/interview/question-card";
import { Card } from "@/components/ui/card";
import { serverApi } from "@/lib/api-server";
import { cn } from "@/lib/cn";
import { CATEGORIES, DIFFICULTY, filterQuestions, parseCategory, parseDifficulty, progressByCategory } from "@/lib/interview-format";
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

function href(category: string | null, difficulty: number | null) {
  const query = new URLSearchParams();
  if (category) query.set("categoria", category);
  if (difficulty) query.set("nivel", String(difficulty));
  const text = query.toString();
  return text ? `/entrevista?${text}` : "/entrevista";
}

async function Questions({ searchParams }: { searchParams: PageProps<"/entrevista">["searchParams"] }) {
  const [{ aiEnabled, questions }, query] = await Promise.all([serverApi<QuestionList>("/api/interview/questions", "/entrevista"), searchParams]);
  const category = parseCategory(query.categoria);
  const difficulty = parseDifficulty(query.nivel);
  const visible = filterQuestions(questions, category, difficulty);
  const progress = progressByCategory(questions);
  const answered = questions.filter((entry) => entry.attempts > 0).length;

  return (
    <>
      <Card tone="lavender" className="mt-6 flex flex-wrap items-center justify-between gap-3 p-5">
        <p className="font-display text-xl font-semibold">
          {answered} de {questions.length} perguntas respondidas
        </p>
        <p className="text-sm font-bold text-muted">{aiEnabled ? "Feedback com IA ligado" : "Feedback por IA indisponível: revisão simples"}</p>
      </Card>

      <nav aria-label="Categorias" className="-mx-5 mt-6 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Link href={href(null, difficulty)} className={chip(category === null)} aria-current={category === null ? "true" : undefined}>
          Todas
        </Link>
        {CATEGORIES.map((entry) => {
          const stats = progress.get(entry.slug);
          return (
            <Link key={entry.slug} href={href(entry.slug, difficulty)} className={chip(category === entry.slug)} aria-current={category === entry.slug ? "true" : undefined}>
              <span aria-hidden>{entry.emoji}</span> {entry.title}
              {stats && <span className="ml-1.5 opacity-70 tabular-nums">{stats.answered}/{stats.total}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Dificuldade">
        <Link href={href(category, null)} className={chip(difficulty === null)}>
          Qualquer nível
        </Link>
        {([1, 2, 3] as const).map((value) => (
          <Link key={value} href={href(category, value)} className={chip(difficulty === value)}>
            {DIFFICULTY[value]}
          </Link>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="mt-10 text-center text-lg text-muted">Nenhuma pergunta com esses filtros.</p>
      ) : (
        <ul className="mt-6 grid gap-5 sm:grid-cols-2">
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
