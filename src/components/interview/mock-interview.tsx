"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { FeedbackView, ListenButton } from "@/components/interview/feedback-view";
import { VoiceInput } from "@/components/interview/voice-input";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ApiError, api } from "@/lib/api-client";
import { cn } from "@/lib/cn";
import { CATEGORIES, categoryEmoji, categoryTitle, DIFFICULTY, formatSeconds, pickRandom, scoreLabel, summarizeMock, wordCount } from "@/lib/interview-format";
import type { Attempt, QuestionSummary } from "@/lib/interview-types";

const MIN_CHARS = 40;
const MAX_CHARS = 4000;
const SIZES = [3, 5, 8] as const;
const CHIP = (active: boolean) =>
  cn(
    "h-11 rounded-pill border-2 px-5 text-sm font-bold transition-colors",
    active ? "border-foreground bg-foreground text-background" : "border-border bg-surface text-muted hover:border-sky hover:text-foreground",
  );
const SELECT =
  "h-11 rounded-2xl border-2 border-border bg-surface px-3 text-base hover:border-sky focus-visible:border-sky focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky/30";

type Result = { question: QuestionSummary; attempt: Attempt | null; seconds: number };

function clock(total: number) {
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

export function MockInterview({ questions, aiEnabled }: { questions: QuestionSummary[]; aiEnabled: boolean }) {
  const [size, setSize] = useState<(typeof SIZES)[number]>(5);
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState(0);
  const [deck, setDeck] = useState<QuestionSummary[] | null>(null);
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<Result[]>([]);
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const startedAt = useRef<number>(0);
  const editor = useRef<HTMLTextAreaElement>(null);

  const pool = questions.filter((entry) => (!category || entry.category === category) && (!level || entry.difficulty === level));
  const finished = deck !== null && results.length === deck.length;
  const current = deck && !finished ? deck[index] : null;

  // cronômetro da pergunta atual
  useEffect(() => {
    if (!current) return;
    startedAt.current = Date.now();
    const timer = setInterval(() => setElapsed(Math.round((Date.now() - startedAt.current) / 1000)), 1000);
    return () => clearInterval(timer);
  }, [current]);

  function start() {
    if (pool.length === 0) return;
    setDeck(pickRandom(pool, size));
    setResults([]);
    setIndex(0);
    resetQuestion();
  }

  function resetQuestion() {
    setAnswer("");
    setError(null);
    setElapsed(0);
    requestAnimationFrame(() => editor.current?.focus());
  }

  function advance(result: Result) {
    setResults((previous) => [...previous, result]);
    setIndex((previous) => previous + 1);
    resetQuestion();
  }

  async function send() {
    if (!current || busy || answer.trim().length < MIN_CHARS) return;
    setBusy(true);
    setError(null);
    const seconds = Math.min(7200, Math.max(1, Math.round((Date.now() - startedAt.current) / 1000)));
    try {
      const { attempt } = await api<{ attempt: Attempt }>(`/interview/questions/${current.slug}/attempts`, {
        method: "POST",
        body: { answer: answer.trim(), seconds },
      });
      advance({ question: current, attempt, seconds });
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "Não deu para enviar agora. Confira a conexão e tente de novo.");
    } finally {
      setBusy(false);
    }
  }

  function skip() {
    if (current) advance({ question: current, attempt: null, seconds: 0 });
  }

  /* ---------------------------- 1. configurar ---------------------------- */
  if (!deck) {
    return (
      <div className="mt-8 flex flex-col gap-6">
        <Card className="flex flex-col gap-6 p-6">
          <div>
            <h2 className="font-display text-xl font-semibold">Quantas perguntas?</h2>
            <div role="group" aria-label="Quantidade de perguntas" className="mt-3 flex flex-wrap gap-2">
              {SIZES.map((value) => (
                <button key={value} type="button" aria-pressed={size === value} onClick={() => setSize(value)} className={CHIP(size === value)}>
                  {value} perguntas
                </button>
              ))}
            </div>
            <p className="mt-2 text-sm text-muted">{size === 3 ? "Uns 10 minutos." : size === 5 ? "Uns 15 a 20 minutos." : "Uns 30 minutos."}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm font-semibold">
              Assunto
              <select value={category} onChange={(event) => setCategory(event.target.value)} className={SELECT}>
                <option value="">Tudo misturado</option>
                {CATEGORIES.map((entry) => (
                  <option key={entry.slug} value={entry.slug}>
                    {entry.emoji} {entry.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm font-semibold">
              Dificuldade
              <select value={level} onChange={(event) => setLevel(Number(event.target.value))} className={SELECT}>
                <option value={0}>Qualquer nível</option>
                {([1, 2, 3] as const).map((value) => (
                  <option key={value} value={value}>
                    {DIFFICULTY[value]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {pool.length === 0 ? (
            <p role="alert" className="font-semibold text-coral-edge">
              Não há perguntas com essa combinação. Mude o assunto ou o nível.
            </p>
          ) : pool.length < size ? (
            <p className="text-sm text-muted">Só existem {pool.length} perguntas com esses filtros; o simulado terá {pool.length}.</p>
          ) : null}

          <ul className="flex list-disc flex-col gap-1 pl-5 text-pretty text-muted">
            <li>Você vê uma pergunta por vez e responde em inglês, escrevendo ou falando.</li>
            <li>O feedback aparece só no final, com a nota de cada resposta.</li>
            <li>Cada resposta enviada conta no seu limite diário de respostas.</li>
          </ul>

          {!aiEnabled && (
            <p role="note" className="rounded-2xl bg-butter-soft px-4 py-3 text-sm">
              O feedback por IA está indisponível agora; você receberá uma revisão simples por palavras-chave.
            </p>
          )}

          <Button size="lg" onClick={start} disabled={pool.length === 0} className="self-start">
            Começar o simulado
          </Button>
        </Card>
      </div>
    );
  }

  /* ---------------------------- 3. resultado ---------------------------- */
  if (finished) {
    const summary = summarizeMock(results.filter((entry) => entry.attempt).map((entry) => ({ score: entry.attempt?.technicalScore ?? null, seconds: entry.seconds })));
    const skipped = results.length - summary.answered;
    return (
      <div className="mt-8 flex flex-col gap-6">
        <Card tone="primary" className="flex flex-col gap-4 p-6">
          <h2 className="font-display text-3xl font-semibold">Simulado concluído</h2>
          {summary.answered === 0 ? (
            <p className="text-pretty">Você pulou todas as perguntas. Tente de novo quando puder: mesmo uma resposta curta já rende feedback.</p>
          ) : (
            <>
              <p className="text-lg text-pretty">
                Nota média no conteúdo técnico:{" "}
                <strong className="font-display text-2xl">{summary.average === null ? "–" : `${summary.average.toLocaleString("pt-BR")}/5`}</strong>
                {summary.average !== null && <span className="text-muted"> · {scoreLabel(summary.average)}</span>}
              </p>
              <p className="text-muted">
                {summary.answered} {summary.answered === 1 ? "resposta" : "respostas"} em {formatSeconds(summary.seconds)}
                {skipped > 0 && ` · ${skipped} ${skipped === 1 ? "pulada" : "puladas"}`}
              </p>
            </>
          )}
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => setDeck(null)}>Fazer outro simulado</Button>
            <ButtonLink href="/entrevista" variant="ghost">
              Voltar às perguntas
            </ButtonLink>
          </div>
        </Card>

        <section aria-labelledby="mock-results">
          <h2 id="mock-results" className="font-display text-2xl font-semibold">
            Resposta por resposta
          </h2>
          <ol className="mt-3 flex flex-col gap-3">
            {results.map(({ question, attempt, seconds }, position) => (
              <li key={question.slug}>
                <details className="rounded-2xl border-2 border-border bg-surface px-4 py-3" open={position === 0 && attempt !== null}>
                  <summary className="flex cursor-pointer flex-wrap items-center gap-x-4 gap-y-1 font-semibold">
                    <span>{position + 1}.</span>
                    <span lang="en" className="min-w-0 flex-1 text-balance">
                      {question.question}
                    </span>
                    {attempt ? (
                      <span className="text-muted">
                        Nota {attempt.technicalScore ?? "–"}/5
                        {attempt.feedback.grammar?.level && ` · Inglês ${attempt.feedback.grammar.level}`} · {formatSeconds(seconds)}
                      </span>
                    ) : (
                      <span className="text-muted">pulada</span>
                    )}
                  </summary>
                  <div className="mt-4 flex flex-col gap-5">
                    {attempt ? <FeedbackView feedback={attempt.feedback} answer={attempt.answer} /> : <p className="text-muted">Você pulou esta pergunta.</p>}
                    <Link href={`/entrevista/${question.slug}`} className="self-start font-bold underline underline-offset-4">
                      {attempt ? "Praticar esta pergunta de novo" : "Responder esta pergunta"}
                    </Link>
                  </div>
                </details>
              </li>
            ))}
          </ol>
        </section>
      </div>
    );
  }

  /* ---------------------------- 2. responder ---------------------------- */
  const words = wordCount(answer);
  const tooShort = answer.trim().length < MIN_CHARS;
  const last = index === deck.length - 1;
  return (
    <div className="mt-8 flex flex-col gap-5">
      <div className="flex items-center gap-3" aria-label={`Pergunta ${index + 1} de ${deck.length}`}>
        <div className="flex flex-1 gap-1.5" aria-hidden>
          {deck.map((entry, position) => (
            <span key={entry.slug} className={cn("h-2 flex-1 rounded-pill", position < index ? "bg-primary" : position === index ? "bg-sky" : "bg-surface-soft")} />
          ))}
        </div>
        <span className="text-sm font-bold text-muted tabular-nums">
          {index + 1} de {deck.length}
        </span>
      </div>

      <div>
        <p className="flex flex-wrap items-center gap-3 text-sm font-bold">
          <span className="rounded-pill bg-surface-soft px-3 py-0.5">
            <span aria-hidden>{categoryEmoji(current!.category)}</span> {categoryTitle(current!.category)}
          </span>
          <span className="text-muted">{DIFFICULTY[current!.difficulty]}</span>
        </p>
        <h2 lang="en" className="mt-3 font-display text-3xl leading-tight font-semibold text-balance md:text-4xl">
          {current!.question}
        </h2>
        <div className="mt-1">
          <ListenButton text={current!.question} label="Ouvir a pergunta" />
        </div>
      </div>

      <label htmlFor="mock-answer" className="sr-only">
        Sua resposta, em inglês
      </label>
      <textarea
        id="mock-answer"
        ref={editor}
        value={answer}
        onChange={(event) => setAnswer(event.target.value.slice(0, MAX_CHARS))}
        rows={9}
        lang="en"
        spellCheck
        placeholder="Answer as if you were in the interview…"
        className="min-h-56 w-full resize-y rounded-2xl border-2 border-border bg-surface p-4 text-base leading-relaxed hover:border-sky focus-visible:border-sky focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky/30"
      />
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted">
        <span className={cn(words >= 60 && words <= 180 && "font-bold text-primary")}>
          {words} {words === 1 ? "palavra" : "palavras"} · ideal: 60 a 150
        </span>
        <span aria-label={`Tempo: ${formatSeconds(elapsed)}`} className={cn("font-bold tabular-nums", elapsed > 180 && "text-coral-edge")}>
          ⏱ {clock(elapsed)}
        </span>
      </div>
      <VoiceInput onText={(text) => setAnswer((previous) => (previous ? `${previous} ${text}` : text).slice(0, MAX_CHARS))} disabled={busy} />

      {error && (
        <p role="alert" className="font-semibold text-coral-edge">
          {error}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <Button size="lg" onClick={() => void send()} disabled={tooShort || busy}>
          {busy ? "Enviando…" : last ? "Enviar e ver o resultado" : "Enviar e ir para a próxima"}
        </Button>
        <Button variant="ghost" onClick={skip} disabled={busy}>
          Pular
        </Button>
        {tooShort && answer.length > 0 && <span className="text-sm text-muted">Escreva pelo menos duas ou três frases.</span>}
      </div>
    </div>
  );
}
