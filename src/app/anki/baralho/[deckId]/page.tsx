import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Fragment, Suspense } from "react";
import { CountChips } from "@/components/anki/count-chips";
import { DeckNotes } from "@/components/anki/deck-notes";
import { DeckSettings } from "@/components/anki/deck-settings";
import { DeckSubdecks } from "@/components/anki/deck-subdecks";
import { DeckTabs } from "@/components/anki/deck-tabs";
import { toneFor } from "@/components/anki/deck-tones";
import { ButtonLink } from "@/components/ui/button";
import { serverApi } from "@/lib/api-server";
import type { Deck, NotesPage } from "@/lib/anki-types";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Gerenciar baralho" };

export default function DeckPage({ params }: PageProps<"/anki/baralho/[deckId]">) {
  return (
    <Suspense fallback={<DeckSkeleton />}>
      <Manage params={params} />
    </Suspense>
  );
}

function DeckSkeleton() {
  return (
    <div aria-busy="true" aria-label="Carregando baralho" className="flex flex-col gap-6">
      <div className="h-5 w-48 animate-pulse rounded-pill bg-surface-soft" />
      <div className="h-44 animate-pulse rounded-card bg-surface-soft" />
      <div className="h-72 animate-pulse rounded-card bg-surface-soft" />
    </div>
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

  const byId = new Map(decks.map((item) => [item.id, item]));
  const ancestors: Deck[] = [];
  for (let parent = deck.parentId ? byId.get(deck.parentId) : undefined; parent; ) {
    ancestors.unshift(parent);
    parent = parent.parentId ? byId.get(parent.parentId) : undefined;
  }
  const children = decks.filter((item) => item.parentId === deck.id);

  const tone = toneFor(decks, deck);
  const due = deck.counts.new + deck.counts.learning + deck.counts.review;

  return (
    <main>
      <nav aria-label="Você está em" className="text-sm">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-muted">
          <li>
            <Link href="/anki" className="font-semibold transition-colors hover:text-foreground">
              Baralhos
            </Link>
          </li>
          {ancestors.map((ancestor) => (
            <Fragment key={ancestor.id}>
              <li aria-hidden>›</li>
              <li>
                <Link
                  href={`/anki/baralho/${ancestor.id}`}
                  className="font-semibold transition-colors hover:text-foreground"
                >
                  {ancestor.name}
                </Link>
              </li>
            </Fragment>
          ))}
          <li aria-hidden>›</li>
          <li aria-current="page" className="font-bold text-foreground">
            {deck.name}
          </li>
        </ol>
      </nav>

      <section
        className={cn(
          "mt-4 rounded-card border-2 bg-surface p-6 shadow-[0_4px_0_0_var(--color-border)]",
          tone.ring,
        )}
      >
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <span
              aria-hidden
              className={cn(
                "grid size-16 shrink-0 place-items-center rounded-2xl font-display text-3xl font-semibold",
                tone.tile,
              )}
            >
              {deck.name.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <h1 className="font-display text-3xl font-semibold text-balance md:text-4xl">{deck.name}</h1>
              <p className="mt-1 text-muted">
                {deck.totalCards} {deck.totalCards === 1 ? "cartão" : "cartões"}
                {children.length > 0 && ` · ${children.length} ${children.length === 1 ? "subbaralho" : "subbaralhos"}`}
              </p>
            </div>
          </div>

          {due > 0 ? (
            <ButtonLink href={`/anki/estudar/${deck.id}`} size="lg" className="shrink-0">
              Estudar agora
            </ButtonLink>
          ) : (
            <span className="inline-flex h-14 shrink-0 items-center gap-2 rounded-pill bg-primary-soft px-6 font-display text-lg font-semibold text-primary">
              <span aria-hidden>✓</span> Em dia por hoje
            </span>
          )}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t-2 border-border pt-4">
          <CountChips counts={deck.counts} />
          <p className="text-sm text-muted">
            Limite diário: {deck.newPerDay} novos · {deck.reviewsPerDay} revisões
          </p>
        </div>
      </section>

      <div className="mt-8">
        <DeckTabs
          tabs={[
            {
              id: "cards",
              label: "Cartões",
              panel: <DeckNotes deckId={deck.id} initial={notes} />,
            },
            {
              id: "subdecks",
              label: "Subbaralhos",
              badge: children.length,
              panel: <DeckSubdecks deck={deck}>{children}</DeckSubdecks>,
            },
            {
              id: "settings",
              label: "Configurações",
              panel: <DeckSettings deck={deck} />,
            },
          ]}
        />
      </div>
    </main>
  );
}
