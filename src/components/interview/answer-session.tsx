"use client";

import { useEffect, useRef, useState } from "react";
import { FeedbackView, ListenButton } from "@/components/interview/feedback-view";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ApiError, api } from "@/lib/api-client";
import { cn } from "@/lib/cn";
import { formatSeconds, wordCount } from "@/lib/interview-format";
import type { Attempt, QuestionDetail, Sample } from "@/lib/interview-types";

const MIN_CHARS = 40;
const MAX_CHARS = 4000;

function when(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

/** A tela de responder: editor, feedback, resposta de exemplo e o histórico das tentativas. */
export function AnswerSession({ detail }: { detail: QuestionDetail }) {
  const { question, aiEnabled } = detail;
  const [answer, setAnswer] = useState("");
  const [attempts, setAttempts] = useState<Attempt[]>(detail.attempts);
  const [current, setCurrent] = useState<Attempt | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sample, setSample] = useState<Sample | null>(null);
  const [sampleBusy, setSampleBusy] = useState(false);
  const startedAt = useRef<number | null>(null);
  const editor = useRef<HTMLTextAreaElement>(null);
  const result = useRef<HTMLDivElement>(null);

  const words = wordCount(answer);
  const tooShort = answer.trim().length < MIN_CHARS;

  // o resultado entra na tela: leva o foco até ele (leitores de tela e quem está no celular)
  useEffect(() => {
    if (current) result.current?.focus();
  }, [current]);

  function onChange(value: string) {
    startedAt.current ??= Date.now();
    setAnswer(value.slice(0, MAX_CHARS));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (tooShort || busy) return;
    setBusy(true);
    setError(null);
    try {
      const seconds = startedAt.current ? Math.min(7200, Math.round((Date.now() - startedAt.current) / 1000)) : undefined;
      const { attempt } = await api<{ attempt: Attempt }>(`/interview/questions/${question.slug}/attempts`, {
        method: "POST",
        body: { answer: answer.trim(), seconds },
      });
      setCurrent(attempt);
      setAttempts((previous) => [attempt, ...previous].slice(0, 10));
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "Não deu para enviar agora. Confira a conexão e tente de novo.");
    } finally {
      setBusy(false);
    }
  }

  async function loadSample() {
    setSampleBusy(true);
    try {
      setSample(await api<Sample>(`/interview/questions/${question.slug}/sample`));
    } catch {
      setError("Não deu para carregar a resposta de exemplo agora.");
    } finally {
      setSampleBusy(false);
    }
  }

  function retry(text?: string) {
    if (text !== undefined) setAnswer(text);
    setCurrent(null);
    startedAt.current = Date.now();
    requestAnimationFrame(() => editor.current?.focus());
  }

  const previous = attempts.filter((attempt) => attempt.id !== current?.id);

  return (
    <div className="mt-6 flex flex-col gap-8">
      {!aiEnabled && (
        <Card tone="butter" className="p-5" role="note">
          <p className="font-display text-lg font-semibold">Feedback por IA indisponível</p>
          <p className="mt-1 text-pretty">
            Por enquanto você recebe uma revisão simples: ela confere quais pontos importantes aparecem na sua resposta. Veja também a resposta de exemplo.
          </p>
        </Card>
      )}

      {current ? (
        <div ref={result} tabIndex={-1} className="flex flex-col gap-6 outline-none">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-3xl font-semibold">Seu feedback</h2>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => retry()} variant="sky">
                Tentar de novo
              </Button>
            </div>
          </div>
          <FeedbackView feedback={current.feedback} answer={current.answer} onUseImproved={(text) => retry(text)} />
        </div>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-4">
          <label htmlFor="answer" className="font-display text-xl font-semibold">
            Sua resposta, em inglês
          </label>
          <textarea
            id="answer"
            ref={editor}
            value={answer}
            onChange={(event) => onChange(event.target.value)}
            rows={9}
            lang="en"
            spellCheck
            placeholder="Escreva como se estivesse na entrevista. Pode errar: é para isso que serve o feedback."
            aria-describedby="answer-help"
            className="min-h-56 w-full resize-y rounded-2xl border-2 border-border bg-surface p-4 text-base leading-relaxed hover:border-sky focus-visible:border-sky focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky/30"
          />
          <div id="answer-help" className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted">
            <span className={cn(words >= 60 && words <= 180 && "font-bold text-primary")}>
              {words} {words === 1 ? "palavra" : "palavras"} · ideal: 60 a 150
            </span>
            <span>{answer.length}/{MAX_CHARS}</span>
          </div>
          {question.phrases.length > 0 && (
            <details className="rounded-2xl border-2 border-border bg-surface px-4 py-3">
              <summary className="cursor-pointer font-bold">Frases úteis para começar</summary>
              <ul className="mt-3 flex flex-wrap gap-2">
                {question.phrases.map((phrase) => (
                  <li key={phrase}>
                    <button
                      type="button"
                      onClick={() => onChange(answer ? `${answer} ${phrase}` : phrase)}
                      className="rounded-pill bg-sky-soft px-3 py-1.5 text-sm font-semibold transition-colors hover:bg-sky"
                    >
                      {phrase}
                    </button>
                  </li>
                ))}
              </ul>
            </details>
          )}
          {error && (
            <p role="alert" className="font-semibold text-coral-edge">
              {error}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" size="lg" disabled={tooShort || busy}>
              {busy ? "Analisando sua resposta…" : "Receber feedback"}
            </Button>
            {tooShort && answer.length > 0 && <span className="text-sm text-muted">Escreva pelo menos duas ou três frases.</span>}
          </div>
        </form>
      )}

      <section aria-labelledby="sample-title">
        <h2 id="sample-title" className="font-display text-2xl font-semibold">
          Resposta de exemplo
        </h2>
        {sample ? (
          <Card tone="sky" className="mt-3 flex flex-col gap-4 p-5">
            <p className="leading-relaxed whitespace-pre-wrap">{sample.sampleAnswer}</p>
            <ListenButton text={sample.sampleAnswer} label="Ouvir a resposta de exemplo" />
            <div>
              <p className="font-display text-lg font-semibold">O que ela cobre</p>
              <ul className="mt-2 flex flex-col gap-1.5">
                {sample.keyPoints.map((point) => (
                  <li key={point} className="flex gap-3 text-pretty">
                    <span aria-hidden>•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-sm text-muted">Não decore: use como modelo e conte com as suas próprias palavras e experiências.</p>
          </Card>
        ) : (
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <p className="max-w-xl text-pretty text-muted">
              {attempts.length > 0 || current ? "Compare com a sua resposta e veja o que dá para melhorar." : "Tente responder primeiro: você aprende mais. Mas, se travar, pode espiar."}
            </p>
            <Button variant="ghost" onClick={() => void loadSample()} disabled={sampleBusy}>
              {sampleBusy ? "Carregando…" : "Ver resposta de exemplo"}
            </Button>
          </div>
        )}
      </section>

      {previous.length > 0 && (
        <section aria-labelledby="history-title">
          <h2 id="history-title" className="font-display text-2xl font-semibold">
            Suas tentativas anteriores
          </h2>
          <ul className="mt-3 flex flex-col gap-3">
            {previous.map((attempt) => (
              <li key={attempt.id}>
                <details className="rounded-2xl border-2 border-border bg-surface px-4 py-3">
                  <summary className="flex cursor-pointer flex-wrap items-center gap-x-4 gap-y-1 font-semibold">
                    <span>{when(attempt.createdAt)}</span>
                    <span className="text-muted">Nota {attempt.technicalScore ?? "–"}/5</span>
                    {attempt.feedback.grammar?.level && <span className="text-muted">Inglês {attempt.feedback.grammar.level}</span>}
                    {attempt.seconds > 0 && <span className="text-muted">{formatSeconds(attempt.seconds)}</span>}
                  </summary>
                  <div className="mt-4 flex flex-col gap-5">
                    <FeedbackView feedback={attempt.feedback} answer={attempt.answer} />
                    <Button variant="ghost" onClick={() => retry(attempt.answer)} className="self-start">
                      Editar esta resposta
                    </Button>
                  </div>
                </details>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
