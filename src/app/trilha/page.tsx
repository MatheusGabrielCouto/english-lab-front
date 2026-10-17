import type { Metadata } from "next";
import { Suspense } from "react";
import { StatsStrip } from "@/components/trail/stats-strip";
import { TrailMap } from "@/components/trail/trail-map";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { serverApi } from "@/lib/api-server";
import { levelIndex, levelName, type TrailOverview } from "@/lib/trail-types";

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
      <PlacementBanner overview={overview} />

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

/** Convite ao teste de nível; depois dele, o nível do aluno e (se for o caso) o aviso de que as lições ainda não existem. */
function PlacementBanner({ overview }: { overview: TrailOverview }) {
  const { placement } = overview;

  if (!placement) {
    return (
      <Card tone="butter" className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-semibold">Já estuda inglês?</h2>
          <p className="mt-1 text-pretty text-muted">Faça o teste de nível (uns 10 minutos) e comece do ponto certo.</p>
        </div>
        <ButtonLink href="/nivelamento" variant="butter" className="shrink-0">
          Fazer o teste
        </ButtonLink>
      </Card>
    );
  }

  const highest = Math.max(...overview.levels.map((entry) => levelIndex(entry.level)), -1);
  const missing = levelIndex(placement.level) > highest;

  return (
    <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
      <p className="rounded-pill bg-butter-soft px-4 py-1.5 font-bold">
        Seu nível: {placement.level} · {levelName(placement.level)}
      </p>
      <ButtonLink href="/nivelamento" variant="ghost" className="h-9 px-4 text-sm">
        Refazer o teste
      </ButtonLink>
      {missing && (
        <p className="w-full text-pretty text-muted">
          As lições de {placement.level} chegam em breve. Enquanto isso, revise o que já está aqui.
        </p>
      )}
    </div>
  );
}
