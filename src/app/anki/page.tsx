import type { Metadata } from "next";
import { Suspense } from "react";
import { DeckTree } from "@/components/anki/deck-tree";
import { NewDeckToggle } from "@/components/anki/new-deck-toggle";
import { Mascot } from "@/components/mascot";
import { ButtonLink } from "@/components/ui/button";
import { serverApi } from "@/lib/api-server";
import type { Deck } from "@/lib/anki-types";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Anki" };

export default function AnkiPage() {
  return (
    <main>
      <h1 className="font-display text-4xl font-semibold md:text-5xl">Seus baralhos</h1>
      <p className="mt-2 max-w-xl text-lg text-muted text-pretty">
        Revise um pouquinho todo dia. O algoritmo (FSRS) escolhe o melhor momento
        para cada cartão voltar.
      </p>
      <Suspense fallback={<DecksSkeleton />}>
        <Decks />
      </Suspense>
    </main>
  );
}

function DecksSkeleton() {
  return (
    <div aria-busy="true" aria-label="Carregando baralhos" className="mt-8 flex flex-col gap-5">
      <div className="h-36 animate-pulse rounded-card bg-surface-soft" />
      <div className="h-32 animate-pulse rounded-card bg-surface-soft" />
      <div className="h-32 animate-pulse rounded-card bg-surface-soft" />
    </div>
  );
}

async function Decks() {
  const { decks } = await serverApi<{ decks: Deck[] }>("/api/anki/decks", "/anki");

  // Os contadores de um baralho raiz já incluem os subbaralhos: somar só as raízes
  // evita contar o mesmo cartão duas vezes.
  const roots = decks.filter((deck) => !deck.parentId);
  const today = roots.reduce(
    (sum, deck) => ({
      new: sum.new + deck.counts.new,
      learning: sum.learning + deck.counts.learning,
      review: sum.review + deck.counts.review,
    }),
    { new: 0, learning: 0, review: 0 },
  );
  const totalDue = today.new + today.learning + today.review;
  const totalCards = roots.reduce((sum, deck) => sum + deck.totalCards, 0);
  const next = roots
    .filter((deck) => deck.counts.new + deck.counts.learning + deck.counts.review > 0)
    .sort(
      (a, b) =>
        b.counts.new + b.counts.learning + b.counts.review -
        (a.counts.new + a.counts.learning + a.counts.review),
    )[0];

  return (
    <div className="mt-8 flex flex-col gap-10">
      {decks.length > 0 && (
        <section
          aria-labelledby="today"
          className="rounded-card border-2 border-primary/30 bg-primary-soft p-6 shadow-[0_4px_0_0_var(--color-border)]"
        >
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 id="today" className="font-display text-2xl font-semibold">
                {totalDue > 0 ? "Para estudar hoje" : "Tudo em dia por hoje 🎉"}
              </h2>
              <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-3">
                <Stat label="Novos" value={today.new} tone="text-sky-edge" />
                <Stat label="Aprender" value={today.learning} tone="text-coral-edge" />
                <Stat label="Revisar" value={today.review} tone="text-primary" />
                <Stat label="Total de cartões" value={totalCards} />
              </dl>
            </div>
            {next && (
              <div className="flex flex-col items-start gap-1.5 md:items-end">
                <ButtonLink href={`/anki/estudar/${next.id}`} size="lg">
                  Estudar agora
                </ButtonLink>
                <span className="text-sm text-muted">{next.name}</span>
              </div>
            )}
          </div>
        </section>
      )}

      <section aria-label="Lista de baralhos">
        <NewDeckToggle count={decks.length} parents={decks} />

        {decks.length === 0 ? (
          <div className="mx-auto mt-10 flex max-w-sm flex-col items-center text-center">
            <Mascot className="w-40 motion-safe:animate-float" />
            <h3 className="mt-4 font-display text-2xl font-semibold">Vamos criar o primeiro?</h3>
            <p className="mt-2 text-muted text-pretty">
              Dê um nome ao baralho acima e depois adicione seus cartões.
            </p>
          </div>
        ) : (
          <div className="mt-6">
            <DeckTree decks={decks} />
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div>
      <dt className="text-sm font-semibold text-muted">{label}</dt>
      <dd className={cn("font-display text-4xl font-semibold tabular-nums leading-none mt-1", tone)}>
        {value}
      </dd>
    </div>
  );
}
