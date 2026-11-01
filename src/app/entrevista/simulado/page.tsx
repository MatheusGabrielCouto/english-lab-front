import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { MockInterview } from "@/components/interview/mock-interview";
import { serverApi } from "@/lib/api-server";
import type { QuestionList } from "@/lib/interview-types";

export const metadata: Metadata = { title: "Simulado de entrevista" };

export default function MockInterviewPage() {
  return (
    <main className="mt-4">
      <Link href="/entrevista" className="text-muted underline-offset-4 hover:underline">
        ← Todas as perguntas
      </Link>
      <h1 className="mt-4 font-display text-4xl font-semibold text-balance md:text-5xl">Simulado de entrevista</h1>
      <p className="mt-2 max-w-2xl text-lg text-muted text-pretty">
        Perguntas sorteadas, uma de cada vez, como numa entrevista de verdade: você responde tudo e só vê o feedback no final.
      </p>
      <Suspense fallback={<div aria-busy="true" aria-label="Carregando" className="mt-8 h-64 animate-pulse rounded-card bg-surface-soft" />}>
        <Loader />
      </Suspense>
    </main>
  );
}

async function Loader() {
  const { questions, aiEnabled } = await serverApi<QuestionList>("/api/interview/questions", "/entrevista/simulado");
  return <MockInterview questions={questions} aiEnabled={aiEnabled} />;
}
