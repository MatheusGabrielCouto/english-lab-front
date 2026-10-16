"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { api, ApiError } from "@/lib/api-client";
import type { Deck } from "@/lib/anki-types";

/** Cria baralho ou subbaralho. `parents` são as opções de "dentro de". */
export function CreateDeckForm({
  parents,
  fixedParentId,
  onCreated,
}: {
  parents?: Pick<Deck, "id" | "fullName">[];
  /** cria sempre dentro deste baralho (tela de gerenciar) */
  fixedParentId?: string;
  onCreated?: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(undefined);
    try {
      await api("/anki/decks", {
        method: "POST",
        body: { name, parentId: fixedParentId ?? (parentId || null) },
      });
      setName("");
      router.refresh();
      onCreated?.();
    } catch (e) {
      setError(
        e instanceof ApiError
          ? (e.errors[0]?.message ?? e.message)
          : "Não consegui criar o baralho.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1">
        <Field
          id={fixedParentId ? "subdeck-name" : "deck-name"}
          label={fixedParentId ? "Nome do subbaralho" : "Novo baralho"}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex.: Vocabulário"
          maxLength={80}
          required
          error={error}
        />
      </div>

      {!fixedParentId && parents && parents.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="deck-parent" className="font-display text-base font-semibold">
            Dentro de
          </label>
          <select
            id="deck-parent"
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            className="h-12 rounded-2xl border-2 border-border bg-surface px-4 text-base hover:border-sky focus-visible:border-sky focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky/30"
          >
            <option value="">(raiz)</option>
            {parents.map((deck) => (
              <option key={deck.id} value={deck.id}>
                {deck.fullName}
              </option>
            ))}
          </select>
        </div>
      )}

      <Button type="submit" disabled={pending || !name.trim()} className="sm:mb-0">
        {pending ? "Criando…" : "Criar"}
      </Button>
    </form>
  );
}
