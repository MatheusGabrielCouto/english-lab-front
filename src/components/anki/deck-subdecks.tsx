import Link from "next/link";
import { CountChips } from "@/components/anki/count-chips";
import { CreateDeckForm } from "@/components/anki/create-deck-form";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Deck } from "@/lib/anki-types";

/** Subbaralhos diretos do baralho + formulário para criar mais um. */
export function DeckSubdecks({ deck, children }: { deck: Deck; children: Deck[] }) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <Card tone="sky">
        <h2 className="font-display text-2xl font-semibold">Novo subbaralho</h2>
        <p className="mb-4 mt-1 text-muted text-pretty">
          Organize em camadas, como <em>{deck.fullName}::Verbos</em>. Estudar o baralho pai
          inclui os cartões dos filhos.
        </p>
        <CreateDeckForm fixedParentId={deck.id} />
      </Card>

      {children.length === 0 ? (
        <p className="rounded-card border-2 border-dashed border-border px-6 py-8 text-center text-muted">
          Ainda não há subbaralhos aqui.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {children.map((child) => {
            const due = child.counts.new + child.counts.learning + child.counts.review;
            return (
              <li key={child.id}>
                <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <Link
                      href={`/anki/baralho/${child.id}`}
                      className="font-display text-xl font-semibold underline-offset-4 hover:underline"
                    >
                      {child.name}
                    </Link>
                    <p className="text-sm text-muted">
                      {child.totalCards} {child.totalCards === 1 ? "cartão" : "cartões"}
                    </p>
                    <CountChips counts={child.counts} className="mt-3" />
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <ButtonLink href={`/anki/baralho/${child.id}`} variant="ghost">
                      Gerenciar
                    </ButtonLink>
                    {due > 0 && <ButtonLink href={`/anki/estudar/${child.id}`}>Estudar</ButtonLink>}
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
