"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { CreateDeckForm } from "@/components/anki/create-deck-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { api, ApiError } from "@/lib/api-client";
import type { Deck } from "@/lib/anki-types";

export function DeckSettings({ deck }: { deck: Deck }) {
  const router = useRouter();
  const [name, setName] = useState(deck.name);
  const [newPerDay, setNewPerDay] = useState(String(deck.newPerDay));
  const [reviewsPerDay, setReviewsPerDay] = useState(String(deck.reviewsPerDay));
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string }>();

  async function save(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setMessage(undefined);
    try {
      await api(`/anki/decks/${deck.id}`, {
        method: "PATCH",
        body: {
          name,
          newPerDay: Number(newPerDay),
          reviewsPerDay: Number(reviewsPerDay),
        },
      });
      setMessage({ ok: true, text: "Salvo!" });
      router.refresh();
    } catch (e) {
      setMessage({
        ok: false,
        text: e instanceof ApiError ? (e.errors[0]?.message ?? e.message) : "Não consegui salvar.",
      });
    } finally {
      setPending(false);
    }
  }

  async function remove() {
    const ok = window.confirm(
      `Apagar "${deck.fullName}", os subbaralhos e todos os cartões? Isso não pode ser desfeito.`,
    );
    if (!ok) return;
    try {
      await api(`/anki/decks/${deck.id}`, { method: "DELETE" });
      router.replace("/anki");
      router.refresh();
    } catch (e) {
      setMessage({ ok: false, text: e instanceof ApiError ? e.message : "Não consegui apagar." });
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <h2 className="font-display text-2xl font-semibold">Configurações</h2>
        <form onSubmit={save} className="mt-4 flex flex-col gap-4">
          <Field
            id="deck-rename"
            label="Nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Field
              id="new-per-day"
              label="Novos por dia"
              type="number"
              min={0}
              max={9999}
              inputMode="numeric"
              value={newPerDay}
              onChange={(e) => setNewPerDay(e.target.value)}
              required
            />
            <Field
              id="reviews-per-day"
              label="Revisões por dia"
              type="number"
              min={0}
              max={9999}
              inputMode="numeric"
              value={reviewsPerDay}
              onChange={(e) => setReviewsPerDay(e.target.value)}
              required
            />
          </div>
          <p role="status" className={`min-h-5 text-sm font-semibold ${message?.ok ? "text-primary" : "text-coral-edge"}`}>
            {message?.text}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando…" : "Salvar"}
            </Button>
            <Button type="button" variant="coral" onClick={() => void remove()}>
              Apagar baralho
            </Button>
          </div>
        </form>
      </Card>

      <Card tone="sky">
        <h2 className="font-display text-2xl font-semibold">Subbaralho</h2>
        <p className="mb-4 mt-1 text-muted text-pretty">
          Organize em camadas, como <em>{deck.fullName}::Verbos</em>. Estudar o baralho
          pai inclui os cartões dos filhos.
        </p>
        <CreateDeckForm fixedParentId={deck.id} />
      </Card>
    </div>
  );
}
