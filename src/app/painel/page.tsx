import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AppHeader } from "@/components/app-header";
import { AnkiCard, CardSkeleton, GoalCard, PlacementInvite, ReadingCard, Shortcuts, TodayCard, TrailCard } from "@/components/painel/cards";
import { StatsStrip } from "@/components/trail/stats-strip";
import type { Deck } from "@/lib/anki-types";
import type { ChecklistToday } from "@/lib/checklist-types";
import type { GoalOverview } from "@/lib/goal-types";
import { serverApi } from "@/lib/api-server";
import type { Book } from "@/lib/book-types";
import { ankiToday, continueReading, dayMessage, greetingFor, levelProgress } from "@/lib/dashboard";
import { getCurrentUser } from "@/lib/session";
import type { TrailOverview } from "@/lib/trail-types";
import { findNext } from "@/lib/trail-view";

export const metadata: Metadata = { title: "Painel" };

export default function DashboardPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-6">
      <AppHeader />

      {/* a sessão é lida na requisição, então fica atrás de um Suspense */}
      <Suspense fallback={<p className="mt-12 text-muted">Carregando seu painel…</p>}>
        <Dashboard />
      </Suspense>
    </div>
  );
}

async function Dashboard() {
  const user = await getCurrentUser();
  // token "fresco" para o proxy, mas recusado pelo backend: limpa a sessão
  if (!user) redirect("/api/auth/session?next=%2Fpainel&reset=1");

  const overview = await serverApi<TrailOverview>("/api/trail", "/painel");
  const { stats } = overview;
  const isAdmin = user.role === "ADMIN";
  const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: "America/Sao_Paulo" }).format(new Date())) % 24;
  const firstName = user.name.split(" ")[0];
  const started = stats.xp > 0 || overview.levels.some((entry) => entry.units.some((unit) => unit.lessons.some((lesson) => lesson.completed)));

  return (
    <main className="mt-10">
      <h1 className="font-display text-4xl font-semibold text-balance md:text-5xl">
        {greetingFor(hour)}, {firstName}! 👋
      </h1>
      <p className="mt-3 max-w-2xl text-lg text-muted text-pretty">{dayMessage(stats)}</p>

      {!overview.placement && !started && <div className="mt-6"><PlacementInvite /></div>}

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <Suspense fallback={<CardSkeleton label="Carregando o checklist de hoje" />}>
          <Today />
        </Suspense>
        <Suspense fallback={<CardSkeleton label="Carregando sua meta" />}>
          <Goal />
        </Suspense>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <TrailCard next={findNext(overview)} started={started} progress={levelProgress(overview)} />
        <StatsStrip stats={stats} layout="stack" />
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <Suspense fallback={<CardSkeleton label="Carregando o Anki" />}>
          <Anki />
        </Suspense>
        <Suspense fallback={<CardSkeleton label="Carregando sua leitura" />}>
          <Reading isAdmin={isAdmin} />
        </Suspense>
      </div>

      <Shortcuts isAdmin={isAdmin} hasPlacement={overview.placement !== null} />
    </main>
  );
}

async function Anki() {
  const { decks } = await serverApi<{ decks: Deck[] }>("/api/anki/decks", "/painel");
  return <AnkiCard today={ankiToday(decks)} />;
}

async function Reading({ isAdmin }: { isAdmin: boolean }) {
  const { books } = await serverApi<{ books: Book[] }>("/api/books", "/painel");
  return <ReadingCard book={continueReading(books)} isAdmin={isAdmin} />;
}

async function Goal() {
  const overview = await serverApi<GoalOverview>("/api/goal", "/painel");
  return <GoalCard overview={overview} />;
}

async function Today() {
  const data = await serverApi<ChecklistToday>("/api/checklist/today", "/painel");
  return <TodayCard data={data} />;
}
