import type { Metadata } from "next";
import { Suspense } from "react";
import { MotivationBoard } from "@/components/motivation/motivation-board";
import { serverApi } from "@/lib/api-server";
import type { MotivationBoardData, MotivationItem } from "@/lib/motivation-types";

export const metadata: Metadata = { title: "Motivação" };

export default function MotivationPage() {
  return (
    <main className="mt-4">
      <h1 className="font-display text-4xl font-semibold md:text-5xl">Motivação</h1>
      <p className="mt-2 max-w-2xl text-lg text-muted text-pretty">
        O seu mural para os dias em que dá vontade de parar: frases, imagens, vídeos e a sua própria voz. Só você vê.
      </p>
      <Suspense fallback={<Skeleton />}>
        <Content />
      </Suspense>
    </main>
  );
}

function Skeleton() {
  return (
    <div aria-busy="true" aria-label="Carregando o mural" className="mt-6 flex flex-col gap-5">
      <div className="h-56 animate-pulse rounded-card bg-surface-soft" />
      <div className="h-24 animate-pulse rounded-card bg-surface-soft" />
    </div>
  );
}

async function Content() {
  const [board, random] = await Promise.all([
    serverApi<MotivationBoardData>("/api/motivation", "/motivacao"),
    serverApi<{ item: MotivationItem | null }>("/api/motivation/random", "/motivacao"),
  ]);
  return <MotivationBoard initialItems={board.items} initialSpotlight={random.item} mediaEnabled={board.mediaEnabled} />;
}
