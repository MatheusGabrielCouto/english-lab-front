import type { Metadata } from "next";
import { Suspense } from "react";
import { StatsStrip } from "@/components/trail/stats-strip";
import { TrailMap } from "@/components/trail/trail-map";
import { ButtonLink } from "@/components/ui/button";
import { serverApi } from "@/lib/api-server";
import type { TrailOverview } from "@/lib/trail-types";

export const metadata: Metadata = { title: "Trilha de aulas" };

export default function TrailPage() {
  return (
    <main className="mt-4">
      <h1 className="font-display text-4xl font-semibold md:text-5xl">Sua trilha</h1>
      <p className="mt-2 max-w-xl text-lg text-muted text-pretty">
        Lições curtas, do A1 ao C2. Errou? Sem drama: o exercício volta no fim para você acertar.
      </p>
      <Suspense fallback={<Skeleton />}>
        <Overview />
      </Suspense>
    </main>
  );
}

function Skeleton() {
  return (
    <div aria-busy="true" aria-label="Carregando a trilha" className="mt-8 flex flex-col gap-6">
      <div className="h-28 animate-pulse rounded-card bg-surface-soft" />
      <div className="h-72 animate-pulse rounded-card bg-surface-soft" />
    </div>
  );
}

async function Overview() {
  const overview = await serverApi<TrailOverview>("/api/trail", "/trilha");

  return (
    <>
      <StatsStrip stats={overview.stats} className="mt-8" />

      {overview.next && (
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <ButtonLink
            size="lg"
            href={`/aprender/${overview.next.level.toLowerCase()}/${overview.next.unit}/${overview.next.lesson}`}
          >
            {overview.stats.xp > 0 ? "Continuar" : "Começar"}: {overview.next.title}
          </ButtonLink>
        </div>
      )}

      <div className="mt-12">
        <TrailMap overview={overview} />
      </div>
    </>
  );
}
