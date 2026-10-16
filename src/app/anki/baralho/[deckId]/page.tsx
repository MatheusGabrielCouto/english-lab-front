import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CountChips } from "@/components/anki/count-chips";
import { DeckNotes } from "@/components/anki/deck-notes";
import { DeckSettings } from "@/components/anki/deck-settings";
import { ButtonLink } from "@/components/ui/button";
import { serverApi } from "@/lib/api-server";
import type { Deck, NotesPage } from "@/lib/anki-types";

export const metadata: Metadata = { title: "Gerenciar baralho" };

export default function DeckPage({ params }: PageProps<"/anki/baralho/[deckId]">) {
  return (
    <Suspense fallback={<p className="text-muted">Carregando baralho…</p>}>
      <Manage params={params} />
    </Suspense>
  );
}

async function Manage({ params }: { params: PageProps<"/anki/baralho/[deckId]">["params"] }) {
  const { deckId } = await params;
  const path = `/anki/baralho/${deckId}`;

  const [{ decks }, notes] = await Promise.all([
    serverApi<{ decks: Deck[] }>("/api/anki/decks", path),
    serverApi<NotesPage>(`/api/anki/decks/${deckId}/notes`, path),
  ]);
  const deck = decks.find((item) => item.id === deckId);
  if (!deck) notFound();

  const due = deck.counts.new + deck.counts.learning + deck.counts.review;

  return (
    <main>
      <Link href="/anki" className="font-semibold text-muted transition-colors hover:text-foreground">
        ← Baralhos
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-semibold text-balance">{deck.name}</h1>
          {deck.fullName !== deck.name && (
            <p className="mt-1 text-sm text-muted">{deck.fullName.split("::").join(" › ")}</p>
          )}
          <CountChips counts={deck.counts} className="mt-4" />
        </div>
        {due > 0 && <ButtonLink href={`/anki/estudar/${deck.id}`} size="lg">Estudar agora</ButtonLink>}
      </div>

      <div className="mt-10">
        <DeckNotes deckId={deck.id} initial={notes} />
      </div>

      <div className="mt-12">
        <DeckSettings deck={deck} />
      </div>
    </main>
  );
}
