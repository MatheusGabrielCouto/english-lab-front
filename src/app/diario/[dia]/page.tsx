import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DiaryEditor } from "@/components/diary/diary-editor";
import { serverApi } from "@/lib/api-server";
import { formatFullDay, isDayKey } from "@/lib/diary-format";
import type { DiaryDay } from "@/lib/diary-types";

export const metadata: Metadata = { title: "Diário" };

export default function DiaryDayPage({ params }: PageProps<"/diario/[dia]">) {
  return (
    <main className="mt-4">
      <Link href="/diario/historico" className="text-muted underline-offset-4 hover:underline">
        ← Histórico
      </Link>
      <Suspense fallback={<div aria-busy="true" aria-label="Carregando o dia" className="mt-6 h-96 animate-pulse rounded-card bg-surface-soft" />}>
        <Day params={params} />
      </Suspense>
    </main>
  );
}

async function Day({ params }: { params: PageProps<"/diario/[dia]">["params"] }) {
  const { dia } = await params;
  if (!isDayKey(dia)) notFound();
  const view = await serverApi<DiaryDay>(`/api/diary/entries/${dia}`, `/diario/${dia}`);
  if (view.day > view.today) notFound();

  return (
    <>
      <h1 className="mt-4 font-display text-3xl font-semibold text-balance md:text-4xl">{formatFullDay(dia)}</h1>
      <DiaryEditor key={dia} view={view} />
    </>
  );
}
