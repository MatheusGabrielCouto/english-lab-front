"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { CardText, spokenText } from "@/components/anki/card-text";
import { CountChips } from "@/components/anki/count-chips";
import { VoiceButton } from "@/components/anki/voice-button";
import { Mascot } from "@/components/mascot";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { api, ApiError } from "@/lib/api-client";
import { cn } from "@/lib/cn";
import type { DeckCounts, Part, Rating, StudyState } from "@/lib/anki-types";
import { accuracy, addAnswer, emptyStats, formatDuration, type SessionStats, sessionProgress } from "@/lib/study-stats";
import { useClientValue } from "@/lib/use-client-value";

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

/** Estado FSRS do cartão: 0 novo, 1 aprendendo, 2 revisão, 3 reaprendendo. */
const STATE_PILL: Record<number, { label: string; className: string }> = {
  0: { label: "Novo", className: "bg-sky-soft" },
  1: { label: "Aprendendo", className: "bg-coral-soft" },
  2: { label: "Revisão", className: "bg-primary-soft" },
  3: { label: "Reaprendendo", className: "bg-coral-soft" },
};

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
  const [stats, setStats] = useState<SessionStats>(emptyStats);
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
      const elapsed = Math.min(Date.now() - shownAt.current, 600_000);
      try {
        const next = await api<StudyState>(`/anki/decks/${deck.id}/review`, {
          method: "POST",
          body: { cardId: card.id, rating, durationMs: elapsed },
        });
        setState(next);
        setRevealed(false);
        setStats((current) => addAnswer(current, rating, elapsed));
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

  const progress = sessionProgress(stats.total, state.counts);

  const header = (
    <header className="mx-auto w-full max-w-3xl px-5 pt-5">
      <div className="flex items-center gap-4">
        <Link
          href="/anki"
          aria-label="Sair do estudo e voltar aos baralhos"
          className="grid size-11 shrink-0 place-items-center rounded-full text-xl font-bold text-muted transition-colors hover:bg-surface-soft hover:text-foreground"
        >
          ✕
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-muted">{deck.name}</p>
          <Progress value={progress} label="Progresso da sessão de estudo" className="mt-1" />
        </div>
      </div>
      <CountChips
        counts={state.counts}
        active={card ? activeCounter(card.state) : undefined}
        className="mt-3 justify-center"
      />
    </header>
  );

  if (!card) {
    return (
      <div className="flex min-h-dvh flex-col">
        {header}
        <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-5 py-8">
          <Finished stats={stats} nextDueAt={state.nextDueAt} busy={busy} onRefresh={refresh} error={error} />
        </main>
      </div>
    );
  }

  const side: Part[] = revealed ? card.answer : card.question;
  const pill = STATE_PILL[card.state] ?? STATE_PILL[0];

  return (
    <div className="flex min-h-dvh flex-col">
      {header}

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-5 pt-6 pb-56">
        <Card
          onClick={() => !revealed && setRevealed(true)}
          className={cn(
            "flex min-h-80 flex-1 flex-col gap-5 p-6 sm:p-10",
            !revealed && "cursor-pointer transition-transform hover:-translate-y-0.5",
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <span className={cn("rounded-pill px-3 py-0.5 text-xs font-bold tracking-wide uppercase", pill.className)}>
              {pill.label}
            </span>
            <span className="text-xs font-bold text-muted">{revealed ? "Resposta" : "Pergunta"}</span>
          </div>

          <div className="flex flex-1 flex-col justify-center gap-6 text-center">
            {/* lacuna: ao revelar, a frase completa substitui a que tinha o buraco (sem repetir) */}
            {!(revealed && card.noteType === "CLOZE") && <CardText parts={card.question} />}
            {revealed && (
              <div className="flex flex-col gap-5 motion-safe:animate-[reveal-in_180ms_ease-out]">
                {card.noteType !== "CLOZE" && <hr className="mx-auto w-24 border-t-2 border-border" />}
                <CardText parts={card.answer} className="text-primary" />
                {card.extra && (
                  <p className="mx-auto max-w-prose rounded-2xl bg-surface-soft px-4 py-3 text-left text-base whitespace-pre-wrap text-muted">
                    {card.extra}
                  </p>
                )}
              </div>
            )}
          </div>

          <div onClick={(event) => event.stopPropagation()}>
            <VoiceButton text={spokenText(side)} />
          </div>
        </Card>
      </main>

      {/* ações sempre à vista, na altura do polegar */}
      <footer className="fixed inset-x-0 bottom-0 border-t-2 border-border bg-surface/95 px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur">
        <div className="mx-auto w-full max-w-2xl">
          <p role="alert" className="min-h-5 text-center text-sm font-semibold text-coral-edge">
            {error}
          </p>
          {revealed ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {RATING_BUTTONS.map(({ rating, label, variant }) => (
                <Button
                  key={rating}
                  variant={variant}
                  disabled={busy}
                  onClick={() => void answer(rating)}
                  className="relative h-auto flex-col gap-0.5 py-3"
                  aria-label={`${label}, volta em ${card.intervals[rating]} (tecla ${rating})`}
                >
                  <span className="text-lg">{label}</span>
                  <span className="text-xs font-semibold opacity-75">{card.intervals[rating]}</span>
                  <kbd
                    aria-hidden
                    className="absolute top-1.5 right-2.5 hidden rounded border border-ink/25 px-1 font-sans text-[0.65rem] leading-4 opacity-70 sm:block"
                  >
                    {rating}
                  </kbd>
                </Button>
              ))}
            </div>
          ) : (
            <Button size="lg" className="w-full" onClick={() => setRevealed(true)}>
              Mostrar resposta
            </Button>
          )}
          <p className="mt-2 hidden text-center text-xs text-muted sm:block">
            {revealed ? "Teclas 1 a 4 para responder" : "Espaço ou Enter para mostrar a resposta"}
          </p>
        </div>
      </footer>
    </div>
  );
}

function Finished({
  stats,
  nextDueAt,
  busy,
  onRefresh,
  error,
}: {
  stats: SessionStats;
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

  const studied = stats.total > 0;

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center text-center">
      <Mascot className="w-40 motion-safe:animate-float" />
      <h2 className="mt-4 font-display text-3xl font-semibold text-balance">
        {studied ? "Terminou por hoje! 🎉" : "Nada para estudar agora"}
      </h2>
      <p className="mt-2 text-lg text-pretty text-muted">
        {studied ? "Boa! Voltar amanhã é o que faz a memória durar." : "Seu baralho está em dia."}
        {when && ` O próximo cartão volta em ${when}.`}
      </p>

      {studied && (
        <dl className="mt-6 grid w-full grid-cols-3 gap-3">
          <Card tone="sky" className="p-4">
            <dt className="text-xs font-bold text-muted">Cartões</dt>
            <dd className="mt-1 font-display text-3xl font-semibold tabular-nums">{stats.total}</dd>
          </Card>
          <Card tone="primary" className="p-4">
            <dt className="text-xs font-bold text-muted">Sem errar</dt>
            <dd className="mt-1 font-display text-3xl font-semibold tabular-nums">{accuracy(stats)}%</dd>
          </Card>
          <Card tone="butter" className="p-4">
            <dt className="text-xs font-bold text-muted">Tempo</dt>
            <dd className="mt-1 font-display text-2xl leading-[2.25rem] font-semibold tabular-nums">
              {formatDuration(stats.ms)}
            </dd>
          </Card>
        </dl>
      )}

      <p role="alert" className="mt-3 min-h-5 text-sm font-semibold text-coral-edge">
        {error}
      </p>
      <div className="mt-2 flex flex-col gap-3 sm:flex-row">
        <ButtonLink href="/anki" size="lg" className="whitespace-nowrap sm:px-6">
          Voltar aos baralhos
        </ButtonLink>
        <Button variant="ghost" size="lg" onClick={onRefresh} disabled={busy} className="whitespace-nowrap sm:px-6">
          {busy ? "Verificando…" : "Verificar de novo"}
        </Button>
      </div>
    </div>
  );
}
