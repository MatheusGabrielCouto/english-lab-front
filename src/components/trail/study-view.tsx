"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { richText } from "@/lib/rich-text";
import { speak, useEnglishVoices, useSpeechSettings } from "@/lib/speech";
import type { LessonData, Study } from "@/lib/trail-types";

const CLOSE_BUTTON =
  "grid size-11 shrink-0 place-items-center rounded-full text-xl font-bold text-muted transition-colors hover:bg-surface-soft hover:text-foreground";

function Rich({ text, className }: { text: string; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {richText(text).map((parts, index) => (
        <p key={index} className="text-pretty">
          {parts.map((part, i) => (part.bold ? <strong key={i}>{part.text}</strong> : part.text))}
        </p>
      ))}
    </div>
  );
}

function Examples({ items }: { items: { en: string; pt: string }[] }) {
  const voices = useEnglishVoices();
  const [settings] = useSpeechSettings();
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => (
        <li key={item.en} className="flex items-start gap-3 rounded-2xl bg-surface-soft px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="font-display text-lg leading-snug font-semibold text-pretty">{item.en}</p>
            <p className="text-pretty text-muted">{item.pt}</p>
          </div>
          {voices.length > 0 && (
            <button
              type="button"
              onClick={() => speak(item.en, settings, voices)}
              aria-label={`Ouvir: ${item.en}`}
              className="grid size-10 shrink-0 place-items-center rounded-full text-lg transition-colors hover:bg-surface"
            >
              <span aria-hidden>🔊</span>
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}

function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border-2 border-border">
      <table className="w-full min-w-max border-collapse text-left">
        <thead>
          <tr className="bg-surface-soft">
            {head.map((cell, index) => (
              <th key={index} scope="col" className="px-4 py-2.5 font-display font-semibold">
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-t-2 border-border">
              {row.map((cell, i) => (
                <td key={i} className={cn("px-4 py-2.5", i === 0 && "font-semibold")}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** A explicação da lição: introdução e seções com exemplos, tabelas, dicas e avisos. */
export function StudySections({ study }: { study: Study }) {
  return (
    <div className="flex flex-col gap-6">
      <p className="text-lg text-pretty text-muted">{study.intro}</p>
      {study.summary && study.summary.length > 0 && (
        <div className="rounded-card bg-primary-soft px-5 py-4">
          <h2 className="font-display text-xl font-semibold">Resumo rápido</h2>
          <ul className="mt-2 flex flex-col gap-2">
            {study.summary.map((item) => (
              <li key={item} className="flex gap-3 text-pretty">
                <span aria-hidden className="mt-0.5">
                  ✅
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {study.sections.map((section) => (
        <section key={section.title} className="flex flex-col gap-4">
          <h3 className="font-display text-2xl font-semibold text-balance">{section.title}</h3>
          <Rich text={section.text} />
          {section.table && <Table {...section.table} />}
          {section.examples && <Examples items={section.examples} />}
          {section.tip && (
            <p className="flex gap-3 rounded-2xl bg-sky-soft px-4 py-3 text-pretty">
              <span aria-hidden>💡</span>
              <span>
                <strong>Dica:</strong> {section.tip}
              </span>
            </p>
          )}
          {section.warn && (
            <p className="flex gap-3 rounded-2xl bg-coral-soft px-4 py-3 text-pretty">
              <span aria-hidden>⚠️</span>
              <span>
                <strong>Cuidado:</strong> {section.warn}
              </span>
            </p>
          )}
        </section>
      ))}
    </div>
  );
}

/** "Para fixar": as dicas de depois dos exercícios. */
export function TipsCard({ tips, className }: { tips: string[]; className?: string }) {
  return (
    <Card tone="butter" className={cn("p-5 text-left", className)}>
      <h2 className="font-display text-xl font-semibold">Para fixar</h2>
      <ul className="mt-3 flex flex-col gap-2.5">
        {tips.map((tip) => (
          <li key={tip} className="flex gap-3 text-pretty">
            <span aria-hidden className="mt-0.5">
              ✨
            </span>
            <span>{tip}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/**
 * A explicação em tela cheia, por cima do que estiver aberto (a lição continua montada por baixo,
 * então fechar não perde a resposta em andamento).
 */
export function StudyScreen({
  lesson,
  study,
  action,
  exitHref,
  onClose,
}: {
  lesson: Pick<LessonData, "title" | "unit">;
  study: Study;
  /** texto do botão principal (ex.: "Começar os exercícios" ou "Voltar à lição") */
  action: string;
  /** quando a explicação é a porta de entrada da lição, o ✕ sai dela (em vez de abrir os exercícios) */
  exitHref?: string;
  onClose: () => void;
}) {
  return (
    <div role="dialog" aria-modal="true" aria-label={`Explicação: ${lesson.title}`} className="fixed inset-0 z-40 overflow-y-auto bg-background">
      <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-5 pt-5 pb-32">
        <header className="flex items-center gap-4">
          {exitHref ? (
            <Link href={exitHref} aria-label="Sair da lição" className={CLOSE_BUTTON}>
              ✕
            </Link>
          ) : (
            <button type="button" onClick={onClose} aria-label="Fechar a explicação" className={CLOSE_BUTTON}>
              ✕
            </button>
          )}
          <p className="text-sm font-bold text-muted">
            {lesson.unit.emoji ?? "📘"} {lesson.unit.title}
          </p>
        </header>

        <h1 className="mt-6 font-display text-4xl leading-tight font-semibold text-balance">{lesson.title}</h1>
        <div className="mt-4">
          <StudySections study={study} />
        </div>
      </div>

      <footer className="fixed inset-x-0 bottom-0 border-t-2 border-border bg-surface px-5 py-5">
        <div className="mx-auto w-full max-w-2xl">
          <Button size="lg" onClick={onClose} className="w-full sm:w-auto">
            {action}
          </Button>
        </div>
      </footer>
    </div>
  );
}
