import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ContinueCard } from "@/components/trail/continue-card";
import { LevelTabs } from "@/components/trail/level-tabs";
import { LevelView } from "@/components/trail/level-view";
import { StatsStrip } from "@/components/trail/stats-strip";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { serverApi } from "@/lib/api-server";
import { levelName, type TrailOverview } from "@/lib/trail-types";
import { findNext, levelSummaries, parseLevel, pickLevel } from "@/lib/trail-view";

export const metadata: Metadata = { title: "Trilha de aulas" };

export default function TrailPage({ searchParams }: PageProps<"/trilha">) {
  return (
    <main className="mt-4">
      <h1 className="font-display text-4xl font-semibold md:text-5xl">Sua trilha</h1>
      <p className="mt-2 max-w-xl text-lg text-muted text-pretty">
        Lições curtas, do A1 ao C2. Errou? Sem drama: o exercício volta no fim para você acertar.
      </p>
      <Suspense fallback={<Skeleton />}>
        <Overview searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

function Skeleton() {
  return (
    <div aria-busy="true" aria-label="Carregando a trilha" className="mt-8 flex flex-col gap-6">
      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="h-56 animate-pulse rounded-card bg-surface-soft" />
        <div className="h-56 animate-pulse rounded-card bg-surface-soft" />
      </div>
      <div className="h-16 animate-pulse rounded-2xl bg-surface-soft" />
      <div className="h-72 animate-pulse rounded-card bg-surface-soft" />
    </div>
  );
}

async function Overview({ searchParams }: { searchParams: PageProps<"/trilha">["searchParams"] }) {
  const [overview, query] = await Promise.all([serverApi<TrailOverview>("/api/trail", "/trilha"), searchParams]);

  const summaries = levelSummaries(overview);
  const selected = pickLevel(parseLevel(query.nivel), overview);
  const summary = summaries.find((item) => item.level === selected)!;
  const units = overview.levels.find((entry) => entry.level === selected)?.units ?? [];
  const next = findNext(overview);
  const lastWithContent = summaries.filter((item) => item.hasContent).at(-1)?.level ?? null;
  const placement = overview.placement?.level ?? null;

  return (
    <>
      <div className="mt-8 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <ContinueCard next={next} started={overview.stats.xp > 0} />
        <StatsStrip stats={overview.stats} layout="stack" />
      </div>

      <PlacementBanner overview={overview} />

      <div className="mt-6">
        <LevelTabs summaries={summaries} selected={selected} placement={placement} />
        <div className="mt-6">
          <LevelView
            summary={summary}
            units={units}
            nextLessonId={next && next.level === selected ? next.lesson.id : null}
            placement={placement}
            lastLevelWithContent={lastWithContent && lastWithContent !== selected ? lastWithContent : null}
          />
        </div>
      </div>
    </>
  );
}

/** Convite ao teste de nível; depois dele, só um lembrete discreto do nível e a opção de refazer. */
function PlacementBanner({ overview }: { overview: TrailOverview }) {
  const { placement } = overview;

  if (!placement) {
    return (
      <Card tone="lavender" className="mt-5 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-semibold">Já estuda inglês?</h2>
          <p className="mt-1 text-pretty text-muted">Faça o teste de nível (uns 10 minutos) e comece do ponto certo.</p>
        </div>
        <ButtonLink href="/nivelamento" variant="ghost" className="shrink-0">
          Fazer o teste
        </ButtonLink>
      </Card>
    );
  }

  return (
    <p className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
      <span>
        Seu nível no teste: <strong className="text-foreground">{placement.level} · {levelName(placement.level)}</strong>
      </span>
      <Link href="/nivelamento" className="font-bold underline underline-offset-4">
        refazer
      </Link>
    </p>
  );
}
