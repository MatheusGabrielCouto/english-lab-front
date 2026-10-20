import type { Metadata } from "next";
import { Suspense } from "react";
import { GoalDashboard } from "@/components/goal/goal-dashboard";
import { GoalForm } from "@/components/goal/goal-form";
import { serverApi } from "@/lib/api-server";
import type { GoalOverview } from "@/lib/goal-types";

export const metadata: Metadata = { title: "Minha meta" };

export default function GoalPage({ searchParams }: PageProps<"/meta">) {
  return (
    <main className="mt-4">
      <Suspense fallback={<Skeleton />}>
        <Content searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

function Skeleton() {
  return (
    <div aria-busy="true" aria-label="Carregando a meta" className="mt-8 flex flex-col gap-6">
      <div className="h-64 animate-pulse rounded-card bg-surface-soft" />
      <div className="h-32 animate-pulse rounded-card bg-surface-soft" />
      <div className="h-48 animate-pulse rounded-card bg-surface-soft" />
    </div>
  );
}

async function Content({ searchParams }: { searchParams: PageProps<"/meta">["searchParams"] }) {
  const [overview, query] = await Promise.all([serverApi<GoalOverview>("/api/goal", "/meta"), searchParams]);
  const editing = query.editar !== undefined && overview.goal !== null;

  if (overview.goal && overview.plan && !editing) {
    return (
      <>
        <h1 className="font-display text-4xl font-semibold md:text-5xl">Minha meta</h1>
        <GoalDashboard goal={overview.goal} plan={overview.plan} today={overview.today} />
      </>
    );
  }

  return (
    <>
      <h1 className="font-display text-4xl font-semibold text-balance md:text-5xl">
        {overview.goal ? "Editar minha meta" : "Qual é a sua meta de inglês?"}
      </h1>
      <p className="mt-2 max-w-2xl text-lg text-muted text-pretty">
        {overview.goal
          ? "Mudar a data ou o nível recalcula o plano. O que você já estudou continua valendo."
          : "Trabalhar no exterior começa com um prazo. Escolha o nível e a data e a gente calcula quanto estudar por dia."}
      </p>
      <GoalForm overview={overview} editing={overview.goal} />
    </>
  );
}
