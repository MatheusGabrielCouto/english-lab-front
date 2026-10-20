import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { DiaryEditor } from "@/components/diary/diary-editor";
import { DiaryStatsStrip } from "@/components/diary/diary-stats";
import { WeekStrip } from "@/components/diary/week-strip";
import { serverApi } from "@/lib/api-server";
import { formatDiaryDay } from "@/lib/diary-format";
import type { DiaryDay, DiaryOverview } from "@/lib/diary-types";

export const metadata: Metadata = { title: "Diário" };

export default function DiaryPage() {
  return (
    <main className="mt-4">
      <Suspense fallback={<Skeleton />}>
        <Content />
      </Suspense>
    </main>
  );
}

function Skeleton() {
  return (
    <div aria-busy="true" aria-label="Carregando o diário" className="mt-6 flex flex-col gap-4">
      <div className="h-10 w-64 animate-pulse rounded-card bg-surface-soft" />
      <div className="h-24 animate-pulse rounded-card bg-surface-soft" />
      <div className="h-96 animate-pulse rounded-card bg-surface-soft" />
    </div>
  );
}

async function Content() {
  const overview = await serverApi<DiaryOverview>("/api/diary", "/diario");
  const view: DiaryDay = {
    today: overview.today,
    day: overview.today,
    aiEnabled: overview.aiEnabled,
    editable: true,
    prompt: overview.prompt,
    entry: overview.entry,
  };

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl font-semibold md:text-5xl">Diário</h1>
          <p className="mt-2 text-lg text-muted">{formatDiaryDay(overview.today)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/diario/historico" className="rounded-pill bg-surface-soft px-4 py-2 font-bold transition-colors hover:bg-sky">
            Histórico e busca
          </Link>
          <a href="/api/diary/export" download className="rounded-pill bg-surface-soft px-4 py-2 font-bold transition-colors hover:bg-sky">
            Exportar (.md)
          </a>
        </div>
      </div>
      <p className="mt-2 max-w-2xl text-pretty text-muted">Escreva um pouco em inglês todos os dias. Errar faz parte: depois você pode pedir a correção.</p>

      <div className="mt-6 flex flex-col gap-4">
        <DiaryStatsStrip stats={overview.stats} />
        <WeekStrip week={overview.week} today={overview.today} />
      </div>

      <DiaryEditor view={view} />
    </>
  );
}
