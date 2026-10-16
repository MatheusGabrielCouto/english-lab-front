"use client";

import { useId, useState } from "react";
import { CreateDeckForm } from "@/components/anki/create-deck-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Deck } from "@/lib/anki-types";

/** Barra "Baralhos (N)" com o botão que abre o formulário de criação. */
export function NewDeckToggle({
  count,
  parents,
}: {
  count: number;
  parents: Pick<Deck, "id" | "fullName">[];
}) {
  const [open, setOpen] = useState(count === 0);
  const panelId = useId();

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-display text-2xl font-semibold">
          Baralhos <span className="text-muted">({count})</span>
        </h2>
        <Button
          variant={open ? "ghost" : "primary"}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? "Fechar" : "+ Novo baralho"}
        </Button>
      </div>

      {open && (
        <Card tone="sky" id={panelId} className="mt-4">
          <CreateDeckForm parents={parents} onCreated={() => setOpen(false)} />
        </Card>
      )}
    </div>
  );
}
