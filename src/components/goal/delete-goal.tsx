"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ApiError, api } from "@/lib/api-client";

/** Apagar a meta (o tempo estudado continua guardado, caso você crie outra). */
export function DeleteGoal() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setBusy(true);
    setError(null);
    try {
      await api("/goal", { method: "DELETE" });
      router.refresh();
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "Não deu para apagar agora.");
      setBusy(false);
    }
  }

  if (!confirming) {
    return (
      <Button variant="ghost" onClick={() => setConfirming(true)}>
        Apagar meta
      </Button>
    );
  }
  return (
    <div role="alertdialog" aria-label="Confirmar exclusão da meta" className="flex flex-wrap items-center gap-3">
      <p className="font-semibold">Apagar a meta? O tempo estudado continua guardado.</p>
      <Button variant="coral" onClick={() => void remove()} disabled={busy}>
        {busy ? "Apagando…" : "Sim, apagar"}
      </Button>
      <Button variant="ghost" onClick={() => setConfirming(false)} disabled={busy}>
        Não
      </Button>
      {error && (
        <p role="alert" className="w-full font-semibold text-coral-edge">
          {error}
        </p>
      )}
    </div>
  );
}
