import type { Metadata } from "next";
import { Suspense } from "react";
import { CountChips } from "@/components/anki/count-chips";
import { CreateDeckForm } from "@/components/anki/create-deck-form";
import { Mascot } from "@/components/mascot";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { serverApi } from "@/lib/api-server";
import type { Deck } from "@/lib/anki-types";

export const metadata: Metadata = { title: "Anki" };

export default function AnkiPage() {
  return (
    <main>
      <h1 className="font-display text-4xl font-semibold md:text-5xl">Seus baralhos</h1>
      <p className="mt-2 max-w-xl text-lg text-muted text-pretty">
        Revise um pouquinho todo dia. O algoritmo (FSRS) escolhe o melhor momento
        para cada cartão voltar.
      </p>
      <Suspense fallback={<p className="mt-10 text-muted">Carregando baralhos…</p>}>
        <Decks />
      </Suspense>
    </main>
  );
}

async function Decks() {
  const { decks } = await serverApi<{ decks: Deck[] }>("/api/anki/decks", "/anki");

  return (
    <>
      <Card tone="sky" className="mt-8">
        <CreateDeckForm parents={decks} />
      </Card>

      {decks.length === 0 ? (
        <div className="mx-auto mt-12 flex max-w-sm flex-col items-center text-center">
          <Mascot className="w-40 motion-safe:animate-float" />
          <h2 className="mt-4 font-display text-2xl font-semibold">Vamos criar o primeiro?</h2>
          <p className="mt-2 text-muted text-pretty">
            Dê um nome ao baralho acima e depois adicione seus cartões.
          </p>
        </div>
      ) : (
        <ul className="mt-8 flex flex-col gap-3">
          {decks.map((deck) => (
            <li key={deck.id}>
              <DeckRow deck={deck} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function DeckRow({ deck }: { deck: Deck }) {
  const depth = deck.fullName.split("::").length - 1;
  const due = deck.counts.new + deck.counts.learning + deck.counts.review;

  return (
    <Card
      className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
      style={{ marginLeft: `${Math.min(depth, 4) * 1.5}rem` }}
    >
      <div className="min-w-0">
        <h2 className="truncate font-display text-xl font-semibold">{deck.name}</h2>
        <p className="mt-0.5 text-sm text-muted">
          {deck.totalCards} {deck.totalCards === 1 ? "cartão" : "cartões"}
        </p>
        <CountChips counts={deck.counts} className="mt-3" />
      </div>
      <div className="flex shrink-0 gap-3">
        <ButtonLink href={`/anki/baralho/${deck.id}`} variant="ghost">
          Gerenciar
        </ButtonLink>
        {due > 0 ? (
          <ButtonLink href={`/anki/estudar/${deck.id}`}>Estudar</ButtonLink>
        ) : (
          <span className="inline-flex h-11 items-center rounded-pill bg-surface-soft px-5 font-display font-semibold text-muted">
            Em dia
          </span>
        )}
      </div>
    </Card>
  );
}
