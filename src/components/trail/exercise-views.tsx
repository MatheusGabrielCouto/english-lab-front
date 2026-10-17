"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { splitReading } from "@/lib/reading-prompt";
import { seededShuffle } from "@/lib/shuffle";
import { speak, useEnglishVoices, useSpeechSettings } from "@/lib/speech";
import type { CheckResult, PublicExercise } from "@/lib/trail-types";

type View<E extends PublicExercise> = {
  exercise: E;
  /** quantas vezes este exercício já voltou (varia o embaralhamento) */
  round: number;
  /** depois de corrigir, a tela fica só para ler o resultado */
  locked: boolean;
  result: CheckResult | null;
  /** `null` = ainda sem resposta */
  onAnswer: (answer: unknown) => void;
};

const choiceBase =
  "flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left text-lg font-semibold transition-colors disabled:cursor-default";

/* ------------------------------------------------------------------ *
 * Áudio
 * ------------------------------------------------------------------ */

export function SpeakButton({ text, autoPlay = false }: { text: string; autoPlay?: boolean }) {
  const voices = useEnglishVoices();
  const [settings] = useSpeechSettings();
  const latest = useRef({ settings, voices });
  useEffect(() => {
    latest.current = { settings, voices };
  });
  // o aluno acabou de tocar em algo, então o navegador costuma permitir tocar sozinho
  useEffect(() => {
    if (autoPlay) speak(text, latest.current.settings, latest.current.voices);
  }, [text, autoPlay]);

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => speak(text, settings, voices)}
        className="inline-flex h-14 items-center gap-2 rounded-pill bg-sky px-6 font-display text-lg font-semibold text-ink shadow-[0_4px_0_0_var(--color-sky-edge)] transition-[transform,box-shadow] active:translate-y-1 active:shadow-none"
      >
        <span aria-hidden>🔊</span> Ouvir
      </button>
      <button
        type="button"
        onClick={() => speak(text, { ...settings, rate: Math.max(0.5, settings.rate * 0.6) }, voices)}
        className="inline-flex h-14 items-center gap-2 rounded-pill border-2 border-border bg-surface px-5 font-display text-lg font-semibold shadow-[0_4px_0_0_var(--color-border)] transition-[transform,box-shadow] active:translate-y-1 active:shadow-none"
      >
        <span aria-hidden>🐢</span> Devagar
      </button>
    </div>
  );
}

function Title({ children }: { children: React.ReactNode }) {
  return <h2 className="font-display text-2xl font-semibold text-balance md:text-3xl">{children}</h2>;
}

function TextAnswer({
  label,
  locked,
  result,
  onAnswer,
  className,
  autoFocus = true,
}: {
  label: string;
  locked: boolean;
  result: CheckResult | null;
  onAnswer: (answer: unknown) => void;
  className?: string;
  autoFocus?: boolean;
}) {
  const [value, setValue] = useState("");
  return (
    <input
      type="text"
      aria-label={label}
      placeholder={label}
      value={value}
      disabled={locked}
      autoFocus={autoFocus}
      autoComplete="off"
      autoCorrect="off"
      autoCapitalize="none"
      spellCheck={false}
      onChange={(event) => {
        setValue(event.target.value);
        onAnswer(event.target.value.trim() ? event.target.value : null);
      }}
      className={cn(
        "h-14 w-full rounded-2xl border-2 bg-surface px-4 text-lg font-semibold placeholder:font-normal placeholder:text-muted focus-visible:border-sky focus-visible:ring-4 focus-visible:ring-sky/30 focus-visible:outline-none",
        result ? (result.correct ? "border-primary bg-primary-soft" : "border-coral bg-coral-soft") : "border-border hover:border-sky",
        className,
      )}
    />
  );
}

/* ------------------------------------------------------------------ *
 * Os cinco tipos
 * ------------------------------------------------------------------ */

export function MultipleChoice({ exercise, round, locked, result, onAnswer }: View<Extract<PublicExercise, { type: "MULTIPLE_CHOICE" }>>) {
  const order = useMemo(
    () => seededShuffle(exercise.choices.map((_, index) => index), `${exercise.key}:${round}`),
    [exercise.choices, exercise.key, round],
  );
  const [picked, setPicked] = useState<number | null>(null);

  function pick(index: number) {
    if (locked) return;
    setPicked(index);
    onAnswer(index);
  }

  useEffect(() => {
    if (locked) return;
    const onKey = (event: KeyboardEvent) => {
      const position = Number(event.key) - 1;
      if (!event.metaKey && !event.ctrlKey && !event.altKey && position >= 0 && position < order.length) {
        setPicked(order[position]);
        onAnswer(order[position]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [locked, order, onAnswer]);

  const reading = splitReading(exercise.prompt);

  return (
    <div className="flex flex-col gap-6">
      {reading ? (
        <>
          <figure className="rounded-2xl border-2 border-border bg-surface-soft p-5">
            <figcaption className="mb-2 flex items-center justify-between gap-3 text-sm font-bold text-muted">
              <span>📖 Leia o texto</span>
              <SpeakButtonCompact text={reading.passage} />
            </figcaption>
            <blockquote lang="en" className="text-lg leading-relaxed text-pretty md:text-xl">
              {reading.passage}
            </blockquote>
          </figure>
          <Title>{reading.question}</Title>
        </>
      ) : (
        <Title>{exercise.prompt}</Title>
      )}
      {exercise.speak && <SpeakButton text={exercise.speak} autoPlay />}
      <ul className="flex flex-col gap-3">
        {order.map((index, position) => {
          const isPicked = picked === index;
          const isRight = result !== null && exercise.choices[index] === result.expected;
          return (
            <li key={index}>
              <button
                type="button"
                disabled={locked}
                aria-pressed={isPicked}
                onClick={() => pick(index)}
                className={cn(
                  choiceBase,
                  isRight
                    ? "border-primary bg-primary-soft"
                    : isPicked && result
                      ? "border-coral bg-coral-soft"
                      : isPicked
                        ? "border-sky bg-sky-soft"
                        : "border-border bg-surface hover:border-sky hover:bg-surface-soft",
                )}
              >
                <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-lg border-2 border-border bg-surface text-sm text-muted">
                  {position + 1}
                </span>
                {exercise.choices[index]}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function FillBlank({ exercise, locked, result, onAnswer }: View<Extract<PublicExercise, { type: "FILL_BLANK" }>>) {
  const [before, after] = exercise.sentence.split("___");
  const [picked, setPicked] = useState<string | null>(null);
  const [typed, setTyped] = useState("");
  const state = result ? (result.correct ? "border-primary bg-primary-soft" : "border-coral bg-coral-soft") : null;

  const blank = exercise.choices ? (
    <button
      type="button"
      disabled={locked || picked === null}
      onClick={() => {
        setPicked(null);
        onAnswer(null);
      }}
      aria-label={picked ? `${picked} (tocar para remover)` : "lacuna vazia"}
      className={cn(
        "mx-1 inline-flex h-11 min-w-24 items-center justify-center rounded-xl border-2 border-dashed px-3 align-middle",
        picked ? "border-solid border-sky bg-sky-soft" : "border-border",
        state,
      )}
    >
      {picked}
    </button>
  ) : (
    <input
      type="text"
      aria-label="lacuna"
      value={typed}
      disabled={locked}
      autoFocus
      autoComplete="off"
      autoCorrect="off"
      autoCapitalize="none"
      spellCheck={false}
      style={{ width: `${Math.max(6, typed.length + 2)}ch` }}
      onChange={(event) => {
        setTyped(event.target.value);
        onAnswer(event.target.value.trim() ? event.target.value : null);
      }}
      className={cn(
        "mx-1 h-11 rounded-xl border-2 bg-surface px-3 text-center align-middle focus-visible:border-sky focus-visible:ring-4 focus-visible:ring-sky/30 focus-visible:outline-none",
        state ?? "border-border",
      )}
    />
  );

  return (
    <div className="flex flex-col gap-6">
      <Title>Complete a frase</Title>
      <p className="text-2xl leading-[3rem] font-semibold md:text-3xl md:leading-[3.5rem]">
        {before}
        {blank}
        {after}
      </p>
      {exercise.translation && <p className="text-muted">{exercise.translation}</p>}
      {exercise.choices && (
        <ul className="flex flex-wrap gap-3">
          {exercise.choices.map((choice) => (
            <li key={choice}>
              <button
                type="button"
                disabled={locked}
                onClick={() => {
                  setPicked(choice);
                  onAnswer(choice);
                }}
                className={cn(
                  "rounded-xl border-2 px-4 py-2 text-lg font-semibold transition-colors",
                  picked === choice ? "border-border bg-surface-soft text-muted" : "border-border bg-surface shadow-[0_3px_0_0_var(--color-border)] hover:border-sky",
                )}
              >
                {choice}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function Order({ exercise, locked, result, onAnswer }: View<Extract<PublicExercise, { type: "ORDER" }>>) {
  const [picked, setPicked] = useState<number[]>([]);

  function update(next: number[]) {
    setPicked(next);
    onAnswer(next.length > 0 ? next.map((index) => exercise.words[index]) : null);
  }

  const chip = "rounded-xl border-2 px-4 py-2 text-lg font-semibold transition-colors";

  return (
    <div className="flex flex-col gap-6">
      <Title>Monte a frase em inglês</Title>
      <p className="text-xl text-muted">{exercise.prompt}</p>

      <ol
        aria-label="Sua frase"
        className={cn(
          "flex min-h-20 flex-wrap items-center gap-2 rounded-2xl border-2 border-dashed p-3",
          result ? (result.correct ? "border-primary bg-primary-soft" : "border-coral bg-coral-soft") : "border-border",
        )}
      >
        {picked.map((index, position) => (
          <li key={`${index}-${position}`}>
            <button
              type="button"
              disabled={locked}
              onClick={() => update(picked.filter((_, at) => at !== position))}
              className={cn(chip, "border-border bg-surface shadow-[0_3px_0_0_var(--color-border)] hover:border-sky")}
            >
              {exercise.words[index]}
            </button>
          </li>
        ))}
      </ol>

      <ul aria-label="Palavras" className="flex flex-wrap gap-2">
        {exercise.words.map((word, index) => (
          <li key={`${word}-${index}`}>
            <button
              type="button"
              disabled={locked || picked.includes(index)}
              onClick={() => update([...picked, index])}
              className={cn(
                chip,
                picked.includes(index)
                  ? "border-transparent bg-surface-soft text-transparent select-none"
                  : "border-border bg-surface shadow-[0_3px_0_0_var(--color-border)] hover:border-sky",
              )}
            >
              {word}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Translation({ exercise, locked, result, onAnswer }: View<Extract<PublicExercise, { type: "TRANSLATION" }>>) {
  const toEnglish = exercise.from === "pt";
  return (
    <div className="flex flex-col gap-6">
      <Title>{toEnglish ? "Escreva em inglês" : "Escreva em português"}</Title>
      <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-surface-soft p-5">
        <p className="text-2xl font-semibold">{exercise.prompt}</p>
        {!toEnglish && <SpeakButtonCompact text={exercise.prompt} />}
      </div>
      <TextAnswer label={toEnglish ? "Tradução em inglês" : "Tradução em português"} locked={locked} result={result} onAnswer={onAnswer} />
    </div>
  );
}

function SpeakButtonCompact({ text }: { text: string }) {
  const voices = useEnglishVoices();
  const [settings] = useSpeechSettings();
  return (
    <button
      type="button"
      aria-label="Ouvir em inglês"
      onClick={() => speak(text, settings, voices)}
      className="grid size-11 place-items-center rounded-full bg-sky text-xl shadow-[0_3px_0_0_var(--color-sky-edge)] active:translate-y-0.5 active:shadow-none"
    >
      <span aria-hidden>🔊</span>
    </button>
  );
}

export function Dictation({ exercise, locked, result, onAnswer }: View<Extract<PublicExercise, { type: "DICTATION" }>>) {
  return (
    <div className="flex flex-col gap-6">
      <Title>Escreva o que você ouviu</Title>
      <SpeakButton text={exercise.speak} autoPlay />
      <TextAnswer label="O que você ouviu, em inglês" locked={locked} result={result} onAnswer={onAnswer} />
    </div>
  );
}

export function ExerciseView(props: View<PublicExercise>) {
  const { exercise } = props;
  switch (exercise.type) {
    case "MULTIPLE_CHOICE":
      return <MultipleChoice {...props} exercise={exercise} />;
    case "FILL_BLANK":
      return <FillBlank {...props} exercise={exercise} />;
    case "ORDER":
      return <Order {...props} exercise={exercise} />;
    case "TRANSLATION":
      return <Translation {...props} exercise={exercise} />;
    case "DICTATION":
      return <Dictation {...props} exercise={exercise} />;
  }
}
