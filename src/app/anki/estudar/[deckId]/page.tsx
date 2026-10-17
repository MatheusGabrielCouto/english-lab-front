import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { StudySession } from "@/components/anki/study-session";
import { serverApi } from "@/lib/api-server";
import type { Deck, StudyState } from "@/lib/anki-types";

export const metadata: Metadata = { title: "Estudar" };

export default function StudyPage({ params }: PageProps<"/anki/estudar/[deckId]">) {
  return (
    <Suspense fallback={<p className="grid min-h-dvh place-items-center font-semibold text-muted">Preparando seus cartões…</p>}>
      <Study params={params} />
    </Suspense>
  );
}

async function Study({ params }: { params: PageProps<"/anki/estudar/[deckId]">["params"] }) {
  const { deckId } = await params;
  const path = `/anki/estudar/${deckId}`;

  const [{ decks }, initial] = await Promise.all([
    serverApi<{ decks: Deck[] }>("/api/anki/decks", path),
    serverApi<StudyState>(`/api/anki/decks/${deckId}/study`, path),
  ]);
  const deck = decks.find((item) => item.id === deckId);
  if (!deck) notFound();

  return <StudySession deck={{ id: deck.id, name: deck.fullName.split("::").join(" › ") }} initial={initial} />;
}
