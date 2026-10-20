"use client";

import { ListenButton } from "@/components/interview/feedback-view";
import { Card } from "@/components/ui/card";
import { highlightCorrections } from "@/lib/interview-format";
import type { DiaryFeedback } from "@/lib/diary-types";

/** A correção do diário: o texto com os erros marcados, a explicação de cada um e a versão melhorada. */
export function DiaryFeedbackView({ feedback, text, stale, onRefresh, busy }: { feedback: DiaryFeedback; text: string; stale: boolean; onRefresh: () => void; busy: boolean }) {
  const segments = highlightCorrections(text, feedback.corrections);
  const basic = feedback.provider === "basic";

  return (
    <div className="flex flex-col gap-6">
      {stale && (
        <Card tone="butter" className="flex flex-wrap items-center justify-between gap-3 p-4" role="note">
          <p className="text-pretty">Você mudou o texto depois desta correção. As marcações abaixo podem não bater mais.</p>
          <button type="button" onClick={onRefresh} disabled={busy} className="rounded-pill bg-surface px-4 py-2 font-bold transition-colors hover:bg-surface-soft disabled:opacity-50">
            {busy ? "Corrigindo…" : "Corrigir de novo"}
          </button>
        </Card>
      )}

      {basic && (
        <Card tone="butter" className="p-5" role="note">
          <p className="font-display text-lg font-semibold">{feedback.degraded ? "A correção com IA falhou desta vez" : "Revisão simples, sem IA"}</p>
          <p className="mt-1 text-pretty">{feedback.summary}</p>
        </Card>
      )}

      {!basic && (
        <Card tone="primary" className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="min-w-0 flex-1 basis-64">
            <p className="text-sm font-bold text-muted">Seu inglês neste texto</p>
            <p className="mt-1 text-pretty">{feedback.summary}</p>
          </div>
          {feedback.level && <p className="font-display text-4xl font-semibold">{feedback.level}</p>}
        </Card>
      )}

      <section className="flex flex-col gap-3">
        <h3 className="font-display text-xl font-semibold">{basic ? "O que dá para melhorar" : "Correções"}</h3>
        {feedback.corrections.length > 0 && (
          <p className="rounded-2xl bg-surface-soft px-4 py-3 leading-relaxed whitespace-pre-wrap" lang="en">
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
        )}
        {feedback.corrections.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {feedback.corrections.map((item, index) => (
              <li key={index} className="rounded-2xl border-2 border-border bg-surface p-4">
                <p className="flex flex-wrap items-center gap-x-3 gap-y-1" lang="en">
                  <span className="text-coral-edge line-through decoration-2">{item.original}</span>
                  <span aria-hidden>→</span>
                  <span className="font-bold text-primary-edge">{item.corrected}</span>
                </p>
                <p className="mt-1 text-pretty text-muted">{item.explanation}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="font-semibold text-primary">{basic ? "✅ Nenhuma das regras simples apontou problema." : "✅ Nenhum erro importante. Bom trabalho!"}</p>
        )}
        {feedback.notes.length > 0 && (
          <ul className="flex flex-col gap-2">
            {feedback.notes.map((note) => (
              <li key={note} className="flex gap-3 text-pretty">
                <span aria-hidden>{basic ? "💬" : "✅"}</span>
                <span>{note}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {feedback.improvedVersion && (
        <section className="flex flex-col gap-3">
          <h3 className="font-display text-xl font-semibold">Seu texto, mais natural</h3>
          <p className="rounded-2xl bg-sky-soft px-4 py-3 leading-relaxed whitespace-pre-wrap" lang="en">
            {feedback.improvedVersion}
          </p>
          <div>
            <ListenButton text={feedback.improvedVersion} />
          </div>
        </section>
      )}

      <Card tone="butter" className="p-5">
        <p className="font-display text-lg font-semibold">💡 Para o próximo texto</p>
        <p className="mt-1 text-pretty">{feedback.tip}</p>
      </Card>
    </div>
  );
}
