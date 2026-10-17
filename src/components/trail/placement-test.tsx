"use client";

import Link from "next/link";
import { useEffect, useEffectEvent, useState } from "react";
import { Mascot } from "@/components/mascot";
import { ExerciseView } from "@/components/trail/exercise-views";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ApiError, api } from "@/lib/api-client";
import { levelName, type PlacementData, type PlacementOutcome } from "@/lib/trail-types";

type Phase = "intro" | "testing" | "submitting" | "result";

export function PlacementTest({ data }: { data: PlacementData }) {
  const { questions, result: previous } = data;
  const [phase, setPhase] = useState<Phase>("intro");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [current, setCurrent] = useState<unknown>(null);
  const [outcome, setOutcome] = useState<PlacementOutcome | null>(null);
  const [error, setError] = useState<string | null>(null);

  const question = questions[index];
  const answered = current !== null && current !== undefined;
  const isLast = index === questions.length - 1;

  async function submit(all: Record<string, unknown>) {
    setPhase("submitting");
    setError(null);
    try {
      const body = { answers: questions.map((item) => ({ key: item.key, answer: all[item.key] ?? null })) };
      setOutcome(await api<PlacementOutcome>("/placement", { method: "POST", body }));
      setPhase("result");
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "Não consegui falar com o servidor. Tente de novo.");
      setPhase("testing");
    }
  }

  /** Guarda a resposta (ou "não sei") e segue. Não há correção no meio do teste. */
  function next(skip = false) {
    if (!question) return;
    const all = { ...answers, [question.key]: skip ? null : current };
    setAnswers(all);
    setCurrent(null);
    if (isLast) void submit(all);
    else setIndex(index + 1);
  }

  const onEnter = useEffectEvent((target: EventTarget | null) => {
    if (phase !== "testing" || !answered) return false;
    if (target instanceof Element && target.closest("footer, a")) return false;
    next();
    return true;
  });
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Enter" && !event.isComposing && onEnter(event.target)) event.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function restart() {
    setIndex(0);
    setAnswers({});
    setCurrent(null);
    setOutcome(null);
    setPhase("testing");
  }

  if (phase === "result" && outcome) return <Result outcome={outcome} onRetry={restart} />;

  if (phase === "intro") {
    if (questions.length === 0) {
      return (
        <Shell>
          <p className="mt-16 text-center text-lg text-muted">O teste de nível ainda não está disponível.</p>
          <div className="mt-6 flex justify-center">
            <ButtonLink href="/trilha">Voltar à trilha</ButtonLink>
          </div>
        </Shell>
      );
    }
    return (
      <Shell>
        <div className="flex flex-col items-center text-center">
          <Mascot className="w-32" />
          <h1 className="mt-4 font-display text-4xl font-semibold text-balance md:text-5xl">Teste de nível</h1>
          <p className="mt-3 max-w-md text-lg text-pretty text-muted">
            {questions.length} perguntas, de fácil a difícil, em uns 10 minutos. Assim a gente sabe por onde você deve começar.
          </p>
          <ul className="mt-6 flex max-w-md flex-col gap-2 text-left text-muted">
            <li>✓ Não há correção no meio: você só vê o resultado no final.</li>
            <li>✓ Não sabe? Toque em “Não sei” em vez de chutar: o resultado fica mais certeiro.</li>
            <li>✓ Dá para refazer quando quiser.</li>
          </ul>
          {previous && (
            <Card tone="butter" className="mt-8 w-full max-w-md p-5">
              <p className="text-sm font-bold text-muted">Seu último resultado</p>
              <p className="mt-1 font-display text-2xl font-semibold">
                {previous.level} · {levelName(previous.level)}
              </p>
            </Card>
          )}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" onClick={() => setPhase("testing")}>
              {previous ? "Refazer o teste" : "Começar o teste"}
            </Button>
            <ButtonLink href="/trilha" variant="ghost" size="lg">
              {previous ? "Voltar à trilha" : "Agora não"}
            </ButtonLink>
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-3xl items-center gap-4 px-5 py-5">
        <Link
          href="/trilha"
          aria-label="Sair do teste"
          onClick={(event) => {
            if (index > 0 && !window.confirm("Sair do teste? Suas respostas não serão guardadas.")) event.preventDefault();
          }}
          className="grid size-11 shrink-0 place-items-center rounded-full text-xl font-bold text-muted transition-colors hover:bg-surface-soft hover:text-foreground"
        >
          ✕
        </Link>
        <Progress value={(index / questions.length) * 100} label="Progresso do teste" className="flex-1" />
        <span className="text-sm font-bold text-muted tabular-nums">
          {index + 1}/{questions.length}
        </span>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-5 pt-6 pb-52">
        {phase === "submitting" ? (
          <p role="status" className="mt-16 text-center font-display text-2xl font-semibold">
            Corrigindo o teste…
          </p>
        ) : (
          question && (
            <ExerciseView key={question.key} exercise={question} round={0} locked={false} result={null} onAnswer={setCurrent} />
          )
        )}
      </main>

      <footer className="fixed inset-x-0 bottom-0 border-t-2 border-border bg-surface px-5 py-5">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div aria-live="polite" className="min-w-0 flex-1">
            {error && (
              <p role="alert" className="font-semibold text-coral-edge">
                {error}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button variant="ghost" size="lg" onClick={() => next(true)} disabled={phase === "submitting"}>
              Não sei
            </Button>
            <Button size="lg" onClick={() => next()} disabled={!answered || phase === "submitting"}>
              {isLast ? "Ver meu nível" : "Próxima"}
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto min-h-dvh w-full max-w-2xl px-5 py-12">{children}</main>;
}

function Result({ outcome, onRetry }: { outcome: PlacementOutcome; onRetry: () => void }) {
  return (
    <Shell>
      <div className="flex flex-col items-center text-center">
        <Mascot className="w-32" />
        <p className="mt-4 font-bold text-muted">Você deve começar no nível</p>
        <h1 className="mt-1 font-display text-6xl font-semibold">{outcome.level}</h1>
        <p className="mt-1 font-display text-2xl text-muted">{levelName(outcome.level)}</p>
        <p className="mt-4 max-w-md text-pretty text-muted">
          Você acertou {outcome.correct} de {outcome.total} ({outcome.score}%). A trilha agora começa por aí; o que vem antes continua disponível para revisar.
        </p>
      </div>

      <section aria-labelledby="breakdown" className="mt-10 rounded-card border-2 border-border bg-surface p-6 shadow-[0_4px_0_0_var(--color-border)]">
        <h2 id="breakdown" className="font-display text-xl font-semibold">
          Acertos por nível
        </h2>
        <ul className="mt-4 flex flex-col gap-3">
          {outcome.perLevel.map((item) => (
            <li key={item.level} className="grid grid-cols-[3rem_1fr_3rem] items-center gap-3">
              <span className="font-display font-semibold">{item.level}</span>
              <Progress value={item.total === 0 ? 0 : (item.correct / item.total) * 100} label={`Acertos no ${item.level}`} />
              <span className="text-right text-sm font-bold text-muted tabular-nums">
                {item.correct}/{item.total}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <ButtonLink href="/trilha" size="lg">
          Ir para a trilha
        </ButtonLink>
        <Button variant="ghost" size="lg" onClick={onRetry}>
          Refazer o teste
        </Button>
      </div>
    </Shell>
  );
}
