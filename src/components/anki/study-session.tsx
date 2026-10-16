"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { CardText, spokenText } from "@/components/anki/card-text";
import { VoiceButton } from "@/components/anki/voice-button";
import { CountChips } from "@/components/anki/count-chips";
import { Mascot } from "@/components/mascot";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api, ApiError } from "@/lib/api-client";
import { useClientValue } from "@/lib/use-client-value";
import type { DeckCounts, Part, Rating, StudyState } from "@/lib/anki-types";

const RATING_BUTTONS: {
  rating: Rating;
  label: string;
  variant: "coral" | "butter" | "primary" | "sky";
}[] = [
  { rating: 1, label: "Errei", variant: "coral" },
  { rating: 2, label: "Difícil", variant: "butter" },
  { rating: 3, label: "Bom", variant: "primary" },
  { rating: 4, label: "Fácil", variant: "sky" },
];

/** Qual contador do topo corresponde ao cartão na tela. */
function activeCounter(state: number): keyof DeckCounts {
  if (state === 0) return "new";
  return state === 2 ? "review" : "learning";
}

export function StudySession({
  deck,
  initial,
}: {
  deck: { id: string; name: string };
  initial: StudyState;
}) {
  const [state, setState] = useState(initial);
  const [revealed, setRevealed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [answered, setAnswered] = useState(0);
  const shownAt = useRef(0);
  const card = state.card;

  useEffect(() => {
    shownAt.current = Date.now();
  }, []);

  const refresh = useCallback(async () => {
    setBusy(true);
    setError(undefined);
    try {
      setState(await api<StudyState>(`/anki/decks/${deck.id}/study`));
      setRevealed(false);
      shownAt.current = Date.now();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Não consegui atualizar.");
    } finally {
      setBusy(false);
    }
  }, [deck.id]);

  const answer = useCallback(
    async (rating: Rating) => {
      if (!card || busy) return;
      setBusy(true);
      setError(undefined);
      try {
        const next = await api<StudyState>(`/anki/decks/${deck.id}/review`, {
          method: "POST",
          body: {
            cardId: card.id,
            rating,
            durationMs: Math.min(Date.now() - shownAt.current, 600_000),
          },
        });
        setState(next);
        setRevealed(false);
        setAnswered((count) => count + 1);
        shownAt.current = Date.now();
      } catch (e) {
        if (e instanceof ApiError && e.status === 409) {
          // resposta duplicada (ex.: duas abas): volta para o estado real
          await refresh();
        } else {
          setError(e instanceof ApiError ? e.message : "Não consegui salvar sua resposta.");
        }
      } finally {
        setBusy(false);
      }
    },
    [card, busy, deck.id, refresh],
  );

  // Atalhos: espaço/enter revela; 1–4 respondem.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement;
      if (target.closest("input, textarea, select, [contenteditable]") || event.metaKey || event.ctrlKey) {
        return;
      }
      if (!card) return;
      if (!revealed && (event.key === " " || event.key === "Enter")) {
        event.preventDefault();
        setRevealed(true);
      } else if (revealed && ["1", "2", "3", "4"].includes(event.key)) {
        event.preventDefault();
        void answer(Number(event.key) as Rating);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [card, revealed, answer]);

  const header = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Link href="/anki" className="font-semibold text-muted transition-colors hover:text-foreground">
        ← Baralhos
      </Link>
      <h1 className="truncate font-display text-xl font-semibold">{deck.name}</h1>
      <CountChips counts={state.counts} active={card ? activeCounter(card.state) : undefined} />
    </div>
  );

  if (!card) {
    return (
      <main className="mx-auto max-w-2xl">
        {header}
        <Finished
          answered={answered}
          nextDueAt={state.nextDueAt}
          busy={busy}
          onRefresh={refresh}
          error={error}
        />
      </main>
    );
  }

  const side: Part[] = revealed ? card.answer : card.question;

  return (
    <main className="mx-auto max-w-2xl">
      {header}

      <Card className="mt-6 flex min-h-72 flex-col justify-between gap-6 p-7 sm:p-10">
        <div className="flex flex-1 flex-col justify-center gap-6 text-center">
          <CardText parts={card.question} />
          {revealed && (
            <>
              <hr className="mx-auto w-24 border-t-2 border-border" />
              <CardText parts={card.answer} />
              {card.extra && <p className="text-muted whitespace-pre-wrap">{card.extra}</p>}
            </>
          )}
        </div>
        <VoiceButton text={spokenText(side)} />
      </Card>

      <p role="alert" className="mt-3 min-h-5 text-center text-sm font-semibold text-coral-edge">
        {error}
      </p>

      <div className="mt-2">
        {revealed ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {RATING_BUTTONS.map(({ rating, label, variant }) => (
              <Button
                key={rating}
                variant={variant}
                disabled={busy}
                onClick={() => void answer(rating)}
                className="h-auto flex-col gap-0.5 py-3"
                aria-label={`${label}, volta em ${card.intervals[rating]} (tecla ${rating})`}
              >
                <span className="text-lg">{label}</span>
                <span className="text-xs font-semibold opacity-75">{card.intervals[rating]}</span>
              </Button>
            ))}
          </div>
        ) : (
          <Button size="lg" className="w-full" onClick={() => setRevealed(true)}>
            Mostrar resposta
          </Button>
        )}
        <p className="mt-4 hidden text-center text-sm text-muted sm:block">
          {revealed ? "Teclas 1 a 4 para responder" : "Espaço ou Enter para mostrar a resposta"}
        </p>
      </div>
    </main>
  );
}

function Finished({
  answered,
  nextDueAt,
  busy,
  onRefresh,
  error,
}: {
  answered: number;
  nextDueAt: string | null;
  busy: boolean;
  onRefresh: () => void;
  error?: string;
}) {
  // fuso do navegador: no servidor não há como saber, então só aparece depois de hidratar
  const when = useClientValue(
    () =>
      nextDueAt
        ? new Date(nextDueAt).toLocaleString("pt-BR", {
            weekday: "short",
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })
        : undefined,
    undefined,
  );

  return (
    <div className="mx-auto mt-10 flex max-w-md flex-col items-center text-center">
      <Mascot className="w-44 motion-safe:animate-float" />
      <h2 className="mt-4 font-display text-3xl font-semibold text-balance">
        {answered > 0 ? "Terminou por hoje! 🎉" : "Nada para estudar agora"}
      </h2>
      <p className="mt-2 text-lg text-muted text-pretty">
        {answered > 0
          ? `Você respondeu ${answered} ${answered === 1 ? "cartão" : "cartões"} nesta sessão.`
          : "Seu baralho está em dia."}
        {when && ` O próximo cartão volta em ${when}.`}
      </p>
      <p role="alert" className="mt-2 min-h-5 text-sm font-semibold text-coral-edge">
        {error}
      </p>
      <div className="mt-4 flex gap-3">
        <ButtonLink href="/anki">Voltar aos baralhos</ButtonLink>
        <Button variant="ghost" onClick={onRefresh} disabled={busy}>
          {busy ? "Verificando…" : "Verificar de novo"}
        </Button>
      </div>
    </div>
  );
}
