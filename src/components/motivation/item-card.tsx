"use client";

import { useState } from "react";
import { ItemBody } from "@/components/motivation/item-body";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ApiError, api } from "@/lib/api-client";
import { cn } from "@/lib/cn";
import { QUOTE_MAX } from "@/lib/motivation-format";
import type { MotivationItem } from "@/lib/motivation-types";

const TONE = { QUOTE: "butter", IMAGE: "plain", VIDEO: "sky", AUDIO: "primary" } as const;
const FIELD =
  "w-full rounded-2xl border-2 border-border bg-surface px-4 py-2.5 text-base hover:border-sky focus-visible:border-sky focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky/30";

/** Um item do mural, com favoritar, editar e apagar. */
export function ItemCard({ item, onChange, onRemove }: { item: MotivationItem; onChange: (next: MotivationItem) => void; onRemove: (id: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState({ title: item.title ?? "", text: item.text ?? "", author: item.author ?? "" });

  async function run(task: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await task();
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "Não deu para salvar agora. Tente de novo.");
    } finally {
      setBusy(false);
    }
  }

  const toggleFavorite = () =>
    run(async () => {
      const { item: next } = await api<{ item: MotivationItem }>(`/motivation/${item.id}`, { method: "PATCH", body: { favorite: !item.favorite } });
      onChange(next);
    });

  const save = (event: React.FormEvent) => {
    event.preventDefault();
    return run(async () => {
      const body: Record<string, string> = { title: draft.title.trim() };
      if (item.type === "QUOTE" || item.type === "IMAGE") body.text = draft.text.trim();
      if (item.type === "QUOTE") body.author = draft.author.trim();
      const { item: next } = await api<{ item: MotivationItem }>(`/motivation/${item.id}`, { method: "PATCH", body });
      onChange(next);
      setEditing(false);
    });
  };

  const remove = () =>
    run(async () => {
      await api(`/motivation/${item.id}`, { method: "DELETE" });
      onRemove(item.id);
    });

  return (
    <Card tone={TONE[item.type]} className="p-5">
      <ItemBody item={item} />

      {editing && (
        <form onSubmit={save} className="mt-4 flex flex-col gap-3 border-t-2 border-border pt-4">
          {item.type === "QUOTE" ? (
            <>
              <label className="flex flex-col gap-1 font-bold">
                Frase
                <textarea value={draft.text} maxLength={QUOTE_MAX} rows={3} lang="en" onChange={(event) => setDraft({ ...draft, text: event.target.value })} className={cn(FIELD, "font-normal")} />
              </label>
              <label className="flex flex-col gap-1 font-bold">
                Autor
                <input value={draft.author} maxLength={80} onChange={(event) => setDraft({ ...draft, author: event.target.value })} className={cn(FIELD, "font-normal")} />
              </label>
            </>
          ) : (
            <>
              <label className="flex flex-col gap-1 font-bold">
                Título
                <input value={draft.title} maxLength={120} onChange={(event) => setDraft({ ...draft, title: event.target.value })} className={cn(FIELD, "font-normal")} />
              </label>
              {item.type === "IMAGE" && (
                <label className="flex flex-col gap-1 font-bold">
                  Legenda
                  <input value={draft.text} maxLength={QUOTE_MAX} onChange={(event) => setDraft({ ...draft, text: event.target.value })} className={cn(FIELD, "font-normal")} />
                </label>
              )}
            </>
          )}
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={busy || (item.type === "QUOTE" && draft.text.trim().length < 2)}>
              Salvar
            </Button>
            <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      )}

      {error && (
        <p role="alert" className="mt-3 font-semibold text-coral-edge">
          {error}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-1 border-t-2 border-border/60 pt-3">
        <button
          type="button"
          onClick={() => void toggleFavorite()}
          disabled={busy}
          aria-pressed={item.favorite}
          className={cn("rounded-pill px-3 py-1.5 text-sm font-bold transition-colors hover:bg-surface-soft disabled:opacity-50", item.favorite ? "text-foreground" : "text-muted")}
        >
          <span aria-hidden>{item.favorite ? "⭐" : "☆"}</span> {item.favorite ? "Favorito" : "Favoritar"}
        </button>
        {!editing && (
          <button type="button" onClick={() => setEditing(true)} disabled={busy} className="rounded-pill px-3 py-1.5 text-sm font-bold text-muted transition-colors hover:bg-surface-soft hover:text-foreground">
            Editar
          </button>
        )}
        {confirming ? (
          <span className="ml-auto flex items-center gap-1 text-sm font-bold">
            Apagar?
            <button type="button" onClick={() => void remove()} disabled={busy} className="rounded-pill bg-coral px-3 py-1.5 text-ink transition-[filter] hover:brightness-105">
              Sim
            </button>
            <button type="button" onClick={() => setConfirming(false)} className="rounded-pill px-3 py-1.5 text-muted transition-colors hover:bg-surface-soft">
              Não
            </button>
          </span>
        ) : (
          <button type="button" onClick={() => setConfirming(true)} disabled={busy} className="ml-auto rounded-pill px-3 py-1.5 text-sm font-bold text-coral-edge transition-colors hover:bg-coral-soft">
            Apagar
          </button>
        )}
      </div>
    </Card>
  );
}
