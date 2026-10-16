"use client";

import { useState } from "react";
import { ButtonLink } from "@/components/ui/button";

/**
 * Links de download. É um <a> comum: o navegador baixa o arquivo com o cookie de
 * sessão, sem passar o conteúdo pelo JavaScript.
 */
export function ExportLinks({ deckId, className }: { deckId?: string; className?: string }) {
  const query = deckId ? `?deckId=${deckId}` : "";
  return (
    <div className={className ?? "flex flex-wrap gap-3"}>
      {/* `prefetch` desligado: são downloads, não páginas */}
      <ButtonLink href={`/api/anki/export/apkg${query}`} prefetch={false} download>
        Baixar para o Anki (.apkg)
      </ButtonLink>
      <ButtonLink href={`/api/anki/export/csv${query}`} prefetch={false} download variant="ghost">
        Baixar planilha (.csv)
      </ButtonLink>
    </div>
  );
}

export function ExportPanel({ decks }: { decks: { id: string; fullName: string }[] }) {
  const [deckId, setDeckId] = useState("");

  return (
    <div className="flex flex-col gap-5">
      <label className="flex max-w-md flex-col gap-1.5 font-display text-base font-semibold">
        O que exportar
        <select
          value={deckId}
          onChange={(event) => setDeckId(event.target.value)}
          className="h-12 rounded-2xl border-2 border-border bg-surface px-4 font-sans text-base font-normal hover:border-sky focus-visible:border-sky focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky/30"
        >
          <option value="">Todos os baralhos</option>
          {decks.map((deck) => (
            <option key={deck.id} value={deck.id}>
              {deck.fullName.split("::").join(" › ")} (com subbaralhos)
            </option>
          ))}
        </select>
      </label>
      <ExportLinks deckId={deckId || undefined} />
    </div>
  );
}
