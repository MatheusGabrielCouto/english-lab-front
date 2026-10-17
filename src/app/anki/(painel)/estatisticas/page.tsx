import type { Metadata } from "next";
import { Suspense } from "react";
import { StatsDashboard } from "@/components/anki/stats-dashboard";
import { serverApi } from "@/lib/api-server";
import type { Deck, Stats } from "@/lib/anki-types";

export const metadata: Metadata = { title: "Estatísticas" };

export default function StatsPage() {
  return (
    <main>
      <h1 className="font-display text-4xl font-semibold md:text-5xl">Estatísticas</h1>
      <p className="mt-2 max-w-xl text-lg text-muted text-pretty">
        Acompanhe seu ritmo, o que vem pela frente e quanto você realmente está lembrando.
      </p>
      <div className="mt-8">
        <Suspense fallback={<div aria-busy="true" className="h-96 animate-pulse rounded-card bg-surface-soft" />}>
          <Dashboard />
        </Suspense>
      </div>
    </main>
  );
}

async function Dashboard() {
  const [{ decks }, stats] = await Promise.all([
    serverApi<{ decks: Deck[] }>("/api/anki/decks", "/anki/estatisticas"),
    serverApi<Stats>("/api/anki/stats?days=30", "/anki/estatisticas"),
  ]);
  return (
    <StatsDashboard
      decks={decks.map((deck) => ({ id: deck.id, fullName: deck.fullName }))}
      initial={stats}
    />
  );
}
