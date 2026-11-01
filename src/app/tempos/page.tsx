import type { Metadata } from "next";
import { Suspense } from "react";
import { TenseOverview } from "@/components/tenses/tense-overview";
import { serverApi } from "@/lib/api-server";
import type { TensesOverview } from "@/lib/tense-types";

export const metadata: Metadata = { title: "Tempos verbais" };

export default function TensesPage() {
  return (
    <main className="mt-4">
      <h1 className="font-display text-4xl font-semibold md:text-5xl">Meus tempos verbais</h1>
      <p className="mt-2 max-w-2xl text-pretty text-lg text-muted">Passado, presente e futuro: veja o que você já domina e o que ainda confunde.</p>
      <Suspense fallback={<Skeleton />}>
        <Content />
      </Suspense>
    </main>
  );
}

function Skeleton() {
  return (
    <div aria-busy="true" aria-label="Carregando seus tempos verbais" className="mt-6 flex flex-col gap-4">
      <div className="h-28 animate-pulse rounded-card bg-surface-soft" />
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-64 animate-pulse rounded-card bg-surface-soft" />
        ))}
      </div>
    </div>
  );
}

async function Content() {
  const overview = await serverApi<TensesOverview>("/api/tenses", "/tempos");
  return <TenseOverview overview={overview} />;
}
