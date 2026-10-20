import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AnswerSession } from "@/components/interview/answer-session";
import { serverApi } from "@/lib/api-server";
import { categoryEmoji, categoryTitle, DIFFICULTY } from "@/lib/interview-format";
import type { QuestionDetail } from "@/lib/interview-types";

export const metadata: Metadata = { title: "Responder pergunta" };

export default function QuestionPage({ params }: PageProps<"/entrevista/[slug]">) {
  return (
    <main className="mt-4">
      <Link href="/entrevista" className="text-muted underline-offset-4 hover:underline">
        ← Todas as perguntas
      </Link>
      <Suspense fallback={<div aria-busy="true" aria-label="Carregando a pergunta" className="mt-6 h-96 animate-pulse rounded-card bg-surface-soft" />}>
        <Question params={params} />
      </Suspense>
    </main>
  );
}

async function Question({ params }: { params: PageProps<"/entrevista/[slug]">["params"] }) {
  const { slug } = await params;
  const detail = await serverApi<QuestionDetail>(`/api/interview/questions/${slug}`, `/entrevista/${slug}`);
  const { question } = detail;

  return (
    <>
      <p className="mt-4 flex flex-wrap items-center gap-3 text-sm font-bold">
        <span className="rounded-pill bg-surface-soft px-3 py-0.5">
          <span aria-hidden>{categoryEmoji(question.category)}</span> {categoryTitle(question.category)}
        </span>
        <span className="text-muted">{DIFFICULTY[question.difficulty]}</span>
      </p>
      <h1 className="mt-3 font-display text-3xl leading-tight font-semibold text-balance md:text-4xl" lang="en">
        {question.question}
      </h1>
      {question.context && <p className="mt-2 max-w-2xl text-pretty text-muted">{question.context}</p>}
      <AnswerSession detail={detail} />
    </>
  );
}
