import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ChecklistPanel } from "@/components/checklist/checklist-panel";
import { HistoryCalendar } from "@/components/checklist/history-calendar";
import { Card } from "@/components/ui/card";
import { serverApi } from "@/lib/api-server";
import type { ChecklistToday } from "@/lib/checklist-types";

export const metadata: Metadata = { title: "Hoje" };

export default function TodayPage() {
  return (
    <main className="mt-4">
      <h1 className="font-display text-4xl font-semibold md:text-5xl">Hoje</h1>
      <p className="mt-2 max-w-2xl text-lg text-muted text-pretty">
        O seu checklist do dia. O que você faz na plataforma é marcado sozinho; o resto, você marca. Pouco por dia, todo dia.
      </p>
      <Suspense fallback={<Skeleton />}>
        <Content />
      </Suspense>
    </main>
  );
}

function Skeleton() {
  return (
    <div aria-busy="true" aria-label="Carregando o checklist" className="mt-6 flex flex-col gap-4">
      <div className="h-44 animate-pulse rounded-card bg-surface-soft" />
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className="h-16 animate-pulse rounded-card bg-surface-soft" />
      ))}
    </div>
  );
}

async function Content() {
  const data = await serverApi<ChecklistToday>("/api/checklist/today", "/hoje");
  return (
    <>
      <ChecklistPanel initial={data} />
      <Card className="mt-8 p-6">
        <HistoryCalendar today={data.day} history={data.history} />
      </Card>
      <p className="mt-6 text-muted">
        Quer ver o quanto falta para a sua meta? <Link href="/meta" className="font-bold text-foreground underline underline-offset-4">Abrir minha meta</Link>
      </p>
      <p className="mt-2 text-muted">
        Bateu o desânimo? <Link href="/motivacao" className="font-bold text-foreground underline underline-offset-4">Abrir meu mural de motivação</Link>
      </p>
    </>
  );
}
