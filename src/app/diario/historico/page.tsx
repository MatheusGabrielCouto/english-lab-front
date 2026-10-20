import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { DiaryHistory } from "@/components/diary/diary-history";
import { DiaryStatsStrip } from "@/components/diary/diary-stats";
import { serverApi } from "@/lib/api-server";
import { monthOf } from "@/lib/diary-format";
import type { DiaryListItem, DiaryOverview } from "@/lib/diary-types";

export const metadata: Metadata = { title: "Histórico do diário" };

export default function DiaryHistoryPage() {
  return (
    <main className="mt-4">
      <Link href="/diario" className="text-muted underline-offset-4 hover:underline">
        ← Escrever hoje
      </Link>
      <h1 className="mt-4 font-display text-4xl font-semibold md:text-5xl">Histórico</h1>
      <Suspense fallback={<div aria-busy="true" aria-label="Carregando o histórico" className="mt-6 h-96 animate-pulse rounded-card bg-surface-soft" />}>
        <Content />
      </Suspense>
    </main>
  );
}

async function Content() {
  const overview = await serverApi<DiaryOverview>("/api/diary", "/diario/historico");
  const { entries } = await serverApi<{ entries: DiaryListItem[] }>(`/api/diary/entries?month=${monthOf(overview.today)}`, "/diario/historico");

  return (
    <>
      <div className="mt-5">
        <DiaryStatsStrip stats={overview.stats} />
      </div>
      <DiaryHistory today={overview.today} initial={entries} />
      <p className="mt-8">
        <a href="/api/diary/export" download className="font-bold underline underline-offset-4">
          Exportar tudo (.md)
        </a>
      </p>
    </>
  );
}
