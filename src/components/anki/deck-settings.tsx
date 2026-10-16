"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ExportLinks } from "@/components/anki/export-panel";
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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function save(event: FormEvent) {
    event.preventDefault();
    setMessage(undefined);

    // valida aqui para o erro aparecer no campo certo, sem ir ao servidor
    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = "Dê um nome ao baralho";
    for (const [field, value] of [
      ["newPerDay", newPerDay],
      ["reviewsPerDay", reviewsPerDay],
    ] as const) {
      if (!/^\d+$/.test(value.trim()) || Number(value) > 9999) {
        errors[field] = "Informe um número inteiro de 0 a 9999";
      }
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setPending(true);
    try {
      await api(`/anki/decks/${deck.id}`, {
        method: "PATCH",
        body: {
          name,
          newPerDay: Number(newPerDay),
          reviewsPerDay: Number(reviewsPerDay),
        },
      });
      setMessage({ ok: true, text: "Configurações salvas!" });
      router.refresh();
    } catch (e) {
      if (e instanceof ApiError && e.errors.length > 0) {
        setFieldErrors(Object.fromEntries(e.errors.map((x) => [x.field, x.message])));
      } else {
        setMessage({ ok: false, text: e instanceof ApiError ? e.message : "Não consegui salvar. Tente de novo." });
      }
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
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <Card>
        <h2 className="font-display text-2xl font-semibold">Configurações</h2>
        <form onSubmit={save} noValidate className="mt-5 flex flex-col gap-5">
          <Field
            id="deck-rename"
            label="Nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            required
            error={fieldErrors.name}
          />

          <fieldset className="flex flex-col gap-4 rounded-2xl bg-surface-soft p-4">
            <legend className="px-2 font-display text-base font-semibold">Limites diários</legend>
            <p className="-mt-1 text-sm text-muted text-pretty">
              Valem para este baralho e seus subbaralhos. Para ir devagar no começo, mantenha
              poucos cartões novos: as revisões se acumulam rápido.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
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
                hint="Cartões que você vê pela primeira vez."
                error={fieldErrors.newPerDay}
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
                hint="Cartões que voltam para revisar."
                error={fieldErrors.reviewsPerDay}
              />
            </div>
          </fieldset>

          <p role="status" className={`min-h-5 text-sm font-semibold ${message?.ok ? "text-primary" : "text-coral-edge"}`}>
            {message?.text}
          </p>
          <div>
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando…" : "Salvar configurações"}
            </Button>
          </div>
        </form>
      </Card>

      <Card tone="sky">
        <h2 className="font-display text-xl font-semibold">Exportar este baralho</h2>
        <p className="mb-4 mt-1 text-pretty">
          Leva também os subbaralhos. O arquivo .apkg abre no Anki; os cartões chegam como novos.
        </p>
        <ExportLinks deckId={deck.id} />
      </Card>

      <Card tone="coral">
        <h2 className="font-display text-xl font-semibold">Apagar baralho</h2>
        <p className="mt-1 text-pretty">
          Remove “{deck.fullName}”, todos os subbaralhos, cartões e o histórico de revisões.
          Isso não pode ser desfeito.
        </p>
        <Button type="button" variant="coral" className="mt-4" onClick={() => void remove()}>
          Apagar baralho
        </Button>
      </Card>
    </div>
  );
}
