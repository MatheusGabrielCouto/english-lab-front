"use client";

import Link from "next/link";
import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { ExerciseView } from "@/components/trail/exercise-views";
import { LessonSummary } from "@/components/trail/lesson-summary";
import { StudyScreen } from "@/components/trail/study-view";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ApiError, api } from "@/lib/api-client";
import { cn } from "@/lib/cn";
import { advance, currentKey, isFinished, progressOf, startFlow } from "@/lib/lesson-flow";
import type { CheckResult, FinishResult, LessonData } from "@/lib/trail-types";

const PRAISE = ["Muito bem!", "Isso aí!", "Perfeito!", "Mandou bem!", "Boa!"];

/** Troca o `key` para recomeçar a lição do zero (nova tentativa, nova fila). */
export function LessonPlayer({ lesson }: { lesson: LessonData }) {
  const [run, setRun] = useState(0);
  // a explicação abre sozinha na primeira vez; ao refazer ou repetir, o aluno vai direto aos exercícios
  const showStudy = run === 0 && lesson.bestScore === null;
  return <Run key={run} lesson={lesson} showStudy={showStudy} onRestart={() => setRun((value) => value + 1)} />;
}

function Run({ lesson, showStudy, onRestart }: { lesson: LessonData; showStudy: boolean; onRestart: () => void }) {
  const exercises = useMemo(() => new Map(lesson.exercises.map((exercise) => [exercise.key, exercise])), [lesson.exercises]);
  const [flow, setFlow] = useState(() => startFlow(lesson.exercises.map((exercise) => exercise.key)));
  const [answer, setAnswer] = useState<unknown>(null);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<FinishResult | null>(null);
  const [studying, setStudying] = useState(showStudy && lesson.study !== null);
  const [studied, setStudied] = useState(false);
  const attempt = useRef<Promise<string> | null>(null);
  const continueButton = useRef<HTMLButtonElement>(null);

  const key = currentKey(flow);
  const exercise = key ? exercises.get(key) : undefined;

  /** A tentativa só nasce na primeira resposta: abrir a lição e sair não deixa rastro. */
  function ensureAttempt() {
    attempt.current ??= api<{ attemptId: string }>(`/trail/lessons/${lesson.id}/attempts`, { method: "POST" }).then(
      (response) => response.attemptId,
      (reason: unknown) => {
        attempt.current = null; // deixa tentar de novo
        throw reason;
      },
    );
    return attempt.current;
  }

  const message = (reason: unknown) =>
    reason instanceof ApiError ? reason.message : "Não consegui falar com o servidor. Confira a conexão e tente de novo.";

  async function finish() {
    setBusy(true);
    setError(null);
    try {
      const id = await ensureAttempt();
      setSummary(await api<FinishResult>(`/trail/attempts/${id}/finish`, { method: "POST" }));
    } catch (reason) {
      setError(message(reason));
    } finally {
      setBusy(false);
    }
  }

  async function check() {
    if (!exercise || answer === null || answer === undefined || busy || result) return;
    setBusy(true);
    setError(null);
    try {
      const id = await ensureAttempt();
      setResult(await api<CheckResult>(`/trail/attempts/${id}/check`, { method: "POST", body: { key: exercise.key, answer } }));
    } catch (reason) {
      setError(message(reason));
    } finally {
      setBusy(false);
    }
  }

  function next() {
    if (!result) return;
    const updated = advance(flow, result.correct);
    setFlow(updated);
    setResult(null);
    setAnswer(null);
    if (isFinished(updated)) void finish();
  }

  // Enter confirma/continua. Nos botões do rodapé e nos links ele já faz o que o botão faz;
  // num botão do exercício (a palavra que acabou de tocar) ele verifica, se já houver resposta.
  const hasAnswer = answer !== null && answer !== undefined;
  const onEnter = useEffectEvent((target: EventTarget | null) => {
    const inFooter = target instanceof Element && target.closest("footer, a") !== null;
    if (inFooter || studying) return false;
    if (target instanceof HTMLButtonElement && !result && !hasAnswer) return false; // Enter seleciona
    if (result) next();
    else void check();
    return true;
  });
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Enter" || event.isComposing) return;
      if (onEnter(event.target)) event.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // depois de corrigir, o foco vai para "Continuar" (Enter/Espaço seguem funcionando)
  useEffect(() => {
    if (result) continueButton.current?.focus();
  }, [result]);

  if (summary) return <LessonSummary lesson={lesson} result={summary} onRestart={onRestart} />;

  const finishing = key === null; // fila vazia: só falta fechar a tentativa
  const round = key ? (flow.rounds[key] ?? 0) : 0;

  function leave(event: React.MouseEvent) {
    const started = flow.done.length > 0 || result !== null;
    if (started && !window.confirm("Sair da lição? O que você fez nesta tentativa não conta.")) event.preventDefault();
  }

  return (
    <div className="flex min-h-dvh flex-col">
      {studying && lesson.study && (
        <StudyScreen
          lesson={lesson}
          study={lesson.study}
          action={studied ? "Voltar à lição" : "Começar os exercícios"}
          exitHref={studied ? undefined : "/trilha"}
          onClose={() => {
            setStudying(false);
            setStudied(true);
          }}
        />
      )}
      <header className="mx-auto flex w-full max-w-3xl items-center gap-4 px-5 py-5">
        <Link
          href="/trilha"
          onClick={leave}
          aria-label="Sair da lição"
          className="grid size-11 shrink-0 place-items-center rounded-full text-xl font-bold text-muted transition-colors hover:bg-surface-soft hover:text-foreground"
        >
          ✕
        </Link>
        <Progress value={progressOf(flow)} label="Progresso da lição" className="flex-1" />
        <span className="hidden text-sm font-bold text-muted sm:block">{lesson.title}</span>
        {lesson.study && (
          <button
            type="button"
            onClick={() => setStudying(true)}
            className="shrink-0 rounded-pill px-3 py-2 text-sm font-bold text-muted transition-colors hover:bg-surface-soft hover:text-foreground"
          >
            <span aria-hidden>📖</span> Explicação
          </button>
        )}
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-5 pt-6 pb-64">
        {finishing ? (
          <div role="status" className="mt-16 text-center">
            <p className="font-display text-2xl font-semibold">{error ? "Quase lá…" : "Contando seus pontos…"}</p>
          </div>
        ) : (
          exercise && (
            <>
              {round > 0 && (
                <p className="mb-4 inline-block rounded-pill bg-butter-soft px-3 py-1 text-sm font-bold text-foreground">
                  Revisão: você errou este antes
                </p>
              )}
              <ExerciseView
                key={`${exercise.key}:${round}`}
                exercise={exercise}
                round={round}
                locked={result !== null || busy}
                result={result}
                onAnswer={setAnswer}
              />
            </>
          )
        )}
      </main>

      <footer
        className={cn(
          "fixed inset-x-0 bottom-0 border-t-2 px-5 py-5 transition-colors",
          result ? (result.correct ? "border-primary bg-primary-soft" : "border-coral bg-coral-soft") : "border-border bg-surface",
        )}
      >
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div aria-live="polite" className="min-w-0 flex-1">
            {error ? (
              <p role="alert" className="font-semibold text-coral-edge">
                {error}
              </p>
            ) : result ? (
              <Feedback result={result} praise={PRAISE[flow.done.length % PRAISE.length]} />
            ) : null}
          </div>

          {finishing ? (
            <Button size="lg" onClick={() => void finish()} disabled={busy || !error} className="w-full sm:w-auto">
              Tentar de novo
            </Button>
          ) : result ? (
            <Button ref={continueButton} size="lg" variant={result.correct ? "primary" : "coral"} onClick={next} className="w-full sm:w-auto">
              Continuar
            </Button>
          ) : (
            <Button size="lg" onClick={() => void check()} disabled={answer === null || answer === undefined || busy} className="w-full sm:w-auto">
              {busy ? "Verificando…" : "Verificar"}
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
}

function Feedback({ result, praise }: { result: CheckResult; praise: string }) {
  return (
    <div>
      <p className="font-display text-2xl font-semibold">
        {result.correct ? (result.typo ? "Quase! Confira a escrita" : praise) : "Não foi dessa vez"}
      </p>
      {(!result.correct || result.typo) && (
        <p className="mt-1 text-lg">
          <span className="font-semibold">{result.typo ? "Escreve-se: " : "Resposta certa: "}</span>
          {result.expected}
        </p>
      )}
      {result.explanation && <p className="mt-1 text-pretty text-muted">{result.explanation}</p>}
    </div>
  );
}
