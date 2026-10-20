"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ApiError, api } from "@/lib/api-client";
import { QUOTE_MAX } from "@/lib/motivation-format";
import type { MotivationItem } from "@/lib/motivation-types";

const FIELD =
  "w-full rounded-2xl border-2 border-border bg-surface px-4 py-3 text-base hover:border-sky focus-visible:border-sky focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky/30";

export function QuoteForm({ onAdded }: { onAdded: (item: MotivationItem) => void }) {
  const [text, setText] = useState("");
  const [author, setAuthor] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy || text.trim().length < 2) return;
    setBusy(true);
    setError(null);
    try {
      const { item } = await api<{ item: MotivationItem }>("/motivation/quotes", { method: "POST", body: { text: text.trim(), author: author.trim() || undefined } });
      onAdded(item);
      setText("");
      setAuthor("");
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "Não deu para salvar agora. Tente de novo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-2 font-bold">
        Sua frase
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value.slice(0, QUOTE_MAX))}
          rows={4}
          lang="en"
          placeholder="Uma frase sua, em inglês ou em português: “I am getting better every day.”"
          className={`${FIELD} font-normal`}
        />
        <span className="text-sm font-normal text-muted">
          {text.length}/{QUOTE_MAX}
        </span>
      </label>
      <label className="flex flex-col gap-2 font-bold">
        Autor (opcional)
        <input value={author} maxLength={80} onChange={(event) => setAuthor(event.target.value)} placeholder="Eu mesmo, Mark Twain…" className={`${FIELD} font-normal`} />
      </label>
      {error && (
        <p role="alert" className="font-semibold text-coral-edge">
          {error}
        </p>
      )}
      <div>
        <Button type="submit" disabled={busy || text.trim().length < 2}>
          {busy ? "Salvando…" : "Adicionar frase"}
        </Button>
      </div>
    </form>
  );
}
