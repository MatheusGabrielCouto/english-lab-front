"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { highlightCorrections, scoreLabel } from "@/lib/interview-format";
import type { Feedback } from "@/lib/interview-types";
import { speak, useEnglishVoices, useSpeechSettings } from "@/lib/speech";

/** Ouvir um texto em inglês (some se o navegador não tiver voz). */
export function ListenButton({ text, label = "Ouvir" }: { text: string; label?: string }) {
  const voices = useEnglishVoices();
  const [settings] = useSpeechSettings();
  if (voices.length === 0) return null;
  return (
    <button
      type="button"
      onClick={() => speak(text, settings, voices)}
      className="inline-flex items-center gap-2 rounded-pill px-3 py-1.5 text-sm font-bold text-muted transition-colors hover:bg-surface-soft hover:text-foreground"
    >
      <span aria-hidden>🔊</span> {label}
    </button>
  );
}

function ScoreDots({ score }: { score: number }) {
  return (
    <span role="img" aria-label={`${score} de 5`} className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} aria-hidden className={cn("size-3.5 rounded-full border-2", n <= score ? "border-primary-edge bg-primary" : "border-border bg-surface-soft")} />
      ))}
    </span>
  );
}

const Block = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="flex flex-col gap-3">
    <h3 className="font-display text-xl font-semibold">{title}</h3>
    {children}
  </section>
);

/** O feedback de uma resposta: inglês (com os erros marcados no texto), conteúdo técnico e a versão melhorada. */
export function FeedbackView({
  feedback,
  answer,
  onUseImproved,
}: {
  feedback: Feedback;
  answer: string;
  /** coloca a versão melhorada no editor (só na tela de resposta) */
  onUseImproved?: (text: string) => void;
}) {
  const { grammar, technical, coverage } = feedback;
  const segments = grammar ? highlightCorrections(answer, grammar.corrections) : null;

  return (
    <div className="flex flex-col gap-7">
      <Card tone="primary" className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <p className="text-sm font-bold text-muted">Conteúdo técnico</p>
          <p className="mt-1 flex items-center gap-3 font-display text-2xl font-semibold">
            {technical.score}/5 <ScoreDots score={technical.score} />
          </p>
          <p className="text-muted">{scoreLabel(technical.score)}</p>
        </div>
        {grammar?.level && (
          <div className="text-right">
            <p className="text-sm font-bold text-muted">Seu inglês nesta resposta</p>
            <p className="mt-1 font-display text-3xl font-semibold">{grammar.level}</p>
          </div>
        )}
      </Card>

      {feedback.provider === "basic" && (
        <Card tone="butter" className="p-5" role="note">
          <p className="font-display text-lg font-semibold">{feedback.degraded ? "A correção com IA falhou desta vez" : "Revisão simples, sem IA"}</p>
          <p className="mt-1 text-pretty">{technical.summary}</p>
        </Card>
      )}

      {grammar && segments && (
        <Block title="Seu inglês">
          <p className="text-pretty">{grammar.summary}</p>
          <p className="rounded-2xl bg-surface-soft px-4 py-3 leading-relaxed whitespace-pre-wrap">
            {segments.map((segment, index) =>
              segment.correction ? (
                <mark key={index} className="rounded bg-coral-soft px-1 text-foreground underline decoration-coral decoration-wavy underline-offset-4">
                  {segment.text}
                </mark>
              ) : (
                <span key={index}>{segment.text}</span>
              ),
            )}
          </p>
          {grammar.corrections.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {grammar.corrections.map((item, index) => (
                <li key={index} className="rounded-2xl border-2 border-border bg-surface p-4">
                  <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="text-coral-edge line-through decoration-2">{item.original}</span>
                    <span aria-hidden>→</span>
                    <span className="font-bold text-primary-edge">{item.corrected}</span>
                  </p>
                  <p className="mt-1 text-pretty text-muted">{item.explanation}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="font-semibold text-primary">✅ Nenhum erro importante. Bom trabalho!</p>
          )}
        </Block>
      )}

      {feedback.provider === "claude" && (
        <Block title="Sua resposta técnica">
          <p className="text-pretty">{technical.summary}</p>
          {technical.strengths.length > 0 && (
            <ul className="flex flex-col gap-2">
              {technical.strengths.map((item) => (
                <li key={item} className="flex gap-3 text-pretty">
                  <span aria-hidden>✅</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
          {technical.issues.length > 0 && (
            <ul className="flex flex-col gap-2">
              {technical.issues.map((item) => (
                <li key={item} className="flex gap-3 text-pretty">
                  <span aria-hidden>⚠️</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
        </Block>
      )}

      <Block title="O que uma boa resposta cobre">
        <ul className="flex flex-col gap-2">
          {coverage.map((item) => (
            <li key={item.point} className="flex gap-3 text-pretty">
              <span aria-hidden>{item.covered ? "✅" : "🔎"}</span>
              <span className={cn(!item.covered && "font-semibold")}>
                {item.point}
                <span className="sr-only">{item.covered ? " (você cobriu)" : " (faltou)"}</span>
              </span>
            </li>
          ))}
        </ul>
      </Block>

      {feedback.improvedAnswer && (
        <Block title="Sua resposta, mais afiada">
          <p className="rounded-2xl bg-sky-soft px-4 py-3 leading-relaxed whitespace-pre-wrap">{feedback.improvedAnswer}</p>
          <div className="flex flex-wrap gap-2">
            <ListenButton text={feedback.improvedAnswer} />
            {onUseImproved && (
              <button
                type="button"
                onClick={() => onUseImproved(feedback.improvedAnswer!)}
                className="rounded-pill px-3 py-1.5 text-sm font-bold text-muted transition-colors hover:bg-surface-soft hover:text-foreground"
              >
                ✏️ Usar como ponto de partida
              </button>
            )}
          </div>
        </Block>
      )}

      <Card tone="butter" className="p-5">
        <p className="font-display text-lg font-semibold">💡 Para a próxima tentativa</p>
        <p className="mt-1 text-pretty">{feedback.tip}</p>
      </Card>
    </div>
  );
}
