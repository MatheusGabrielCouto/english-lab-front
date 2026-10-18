"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ApiError, api } from "@/lib/api-client";
import { vocabDeckPath, vocabNotes } from "@/lib/lesson-vocab";
import type { LessonData } from "@/lib/trail-types";
import { useLocalSetting } from "@/lib/use-local-setting";

/** O que aconteceu na hora de adicionar, em português claro. */
function outcomeText({ created, skipped }: { created: number; skipped: number }) {
  if (created === 0) return "todas essas palavras já estavam nos seus cartões";
  const novas = `${created} ${created === 1 ? "cartão novo" : "cartões novos"}`;
  return skipped > 0 ? `${novas}; ${skipped} já ${skipped === 1 ? "existia" : "existiam"}` : novas;
}

/** As palavras da lição, com botão para virarem cartões do Anki (uma vez só por lição). */
export function VocabToAnki({ lesson }: { lesson: LessonData }) {
  const [added, setAdded] = useLocalSetting(`lesson-vocab:${lesson.id}`, "no", ["yes", "no"] as const);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deckId, setDeckId] = useState<string | null>(null);
  const [result, setResult] = useState<{ created: number; skipped: number } | null>(null);

  if (lesson.vocab.length === 0) return null;

  async function add() {
    setBusy(true);
    setError(null);
    try {
      const { deck } = await api<{ deck: { id: string } }>("/anki/decks/ensure", {
        method: "POST",
        body: { names: vocabDeckPath(lesson) },
      });
      // uma chamada só: o servidor pula o que você já tem (em qualquer baralho), então apertar de novo,
      // refazer a lição ou palavras que se repetem entre lições não geram cartões duplicados
      const outcome = await api<{ created: number; skipped: number }>("/anki/notes/batch", {
        method: "POST",
        body: { deckId: deck.id, scope: "collection", notes: vocabNotes(lesson) },
      });
      setResult(outcome);
      setDeckId(deck.id);
      setAdded("yes");
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "Não deu para adicionar agora. Tente de novo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="vocab-title" className="mt-10 w-full rounded-card border-2 border-border bg-surface p-6 text-left shadow-[0_4px_0_0_var(--color-border)]">
      <h2 id="vocab-title" className="font-display text-2xl font-semibold">
        Palavras desta lição
      </h2>
      <ul className="mt-4 grid gap-x-6 gap-y-2 sm:grid-cols-2">
        {lesson.vocab.map((item) => (
          <li key={item.front} className="flex flex-col border-b border-border py-2">
            <span className="font-semibold">{item.front}</span>
            <span className="text-muted">{item.back}</span>
          </li>
        ))}
      </ul>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        {added === "yes" ? (
          <p className="font-semibold text-primary">
            ✓ No seu Anki
            {result && <span className="font-normal text-muted"> · {outcomeText(result)}</span>}
            {deckId && (
              <>
                {" · "}
                <Link href={`/anki/baralho/${deckId}`} className="underline underline-offset-4">
                  ver baralho
                </Link>
              </>
            )}
          </p>
        ) : (
          <Button variant="sky" onClick={() => void add()} disabled={busy}>
            {busy ? "Adicionando…" : `Adicionar ${lesson.vocab.length} cartões ao Anki`}
          </Button>
        )}
        {error && (
          <p role="alert" className="font-semibold text-coral-edge">
            {error}
          </p>
        )}
      </div>
    </section>
  );
}
