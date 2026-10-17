import type { Metadata } from "next";
import { Suspense } from "react";
import { CardBrowser } from "@/components/anki/card-browser";
import { serverApi } from "@/lib/api-server";
import type { Deck, SearchPage } from "@/lib/anki-types";

export const metadata: Metadata = { title: "Cartões" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function CardsPage({ searchParams }: PageProps<"/anki/cartoes">) {
  return (
    <main>
      <h1 className="font-display text-4xl font-semibold md:text-5xl">Cartões</h1>
      <p className="mt-2 max-w-xl text-lg text-muted text-pretty">
        Busque, edite, mova e suspenda cartões de todos os seus baralhos.
      </p>
      <div className="mt-8">
        <Suspense fallback={<div aria-busy="true" className="h-64 animate-pulse rounded-card bg-surface-soft" />}>
          <Browser searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

async function Browser({ searchParams }: { searchParams: PageProps<"/anki/cartoes">["searchParams"] }) {
  const params = await searchParams;
  const one = (key: string) => (typeof params[key] === "string" ? (params[key] as string) : "");

  // aceita ?deckId= (ex.: link vindo da tela do baralho); ignora valores malformados
  const deckId = UUID.test(one("deckId")) ? one("deckId") : "";
  const query = deckId ? `?deckId=${deckId}` : "";

  const [{ decks }, initial] = await Promise.all([
    serverApi<{ decks: Deck[] }>("/api/anki/decks", "/anki/cartoes"),
    serverApi<SearchPage>(`/api/anki/notes${query}`, "/anki/cartoes"),
  ]);

  return (
    <CardBrowser
      decks={decks.map((deck) => ({ id: deck.id, fullName: deck.fullName }))}
      initialFilters={{ q: "", deckId, type: "", status: "", tag: "" }}
      initial={initial}
    />
  );
}
