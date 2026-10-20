"use client";

import { useEffect, useRef, useState } from "react";
import { DiaryFeedbackView } from "@/components/diary/diary-feedback-view";
import { ListenButton } from "@/components/interview/feedback-view";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ApiError, api } from "@/lib/api-client";
import { cn } from "@/lib/cn";
import { draftKey, IDEAL_WORDS, lengthHint, saveStatus } from "@/lib/diary-format";
import { type DiaryDay, type DiaryEntry, type Mood, MOODS } from "@/lib/diary-types";
import { wordCount } from "@/lib/interview-format";

const MAX_CHARS = 8000;
/** Uma pausa maior que isso entre duas teclas não conta como tempo escrevendo. */
const IDLE_MS = 30_000;

function readDraft(day: string) {
  try {
    return localStorage.getItem(draftKey(day));
  } catch {
    return null;
  }
}
function writeDraft(day: string, text: string) {
  try {
    if (text) localStorage.setItem(draftKey(day), text);
    else localStorage.removeItem(draftKey(day));
  } catch {
    // sem armazenamento (janela privada): só não há rascunho
  }
}

/** O editor do dia: escreve, salva (com rascunho no navegador) e pede a correção. */
export function DiaryEditor({ view }: { view: DiaryDay }) {
  const { day, editable, aiEnabled, prompt } = view;
  const [entry, setEntry] = useState<DiaryEntry | null>(view.entry);
  const [text, setText] = useState(view.entry?.text ?? "");
  const [mood, setMood] = useState<Mood | null>(view.entry?.mood ?? null);
  const [restored, setRestored] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const activeMs = useRef(0);
  const lastKey = useRef<number | null>(null);
  const result = useRef<HTMLDivElement>(null);

  const savedText = entry?.text ?? "";
  const dirty = text.trim() !== savedText.trim() || (mood ?? null) !== (entry?.mood ?? null);
  const words = wordCount(text);

  // um rascunho que não chegou a ser salvo (aba fechada, sem internet) volta para o editor
  useEffect(() => {
    if (!editable) return;
    const draft = readDraft(day);
    if (draft && draft.trim() !== (view.entry?.text ?? "").trim()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- o rascunho só existe no navegador
      setText(draft);
      setRestored(true);
    }
  }, [day, editable, view.entry?.text]);

  function onChange(value: string) {
    const now = Date.now();
    if (lastKey.current !== null && now - lastKey.current < IDLE_MS) activeMs.current += now - lastKey.current;
    lastKey.current = now;
    const next = value.slice(0, MAX_CHARS);
    setText(next);
    setRestored(false);
    writeDraft(day, next);
  }

  async function save(): Promise<DiaryEntry | null> {
    if (!text.trim()) return null;
    setSaving(true);
    setError(null);
    try {
      const seconds = Math.min(7200, Math.round(activeMs.current / 1000));
      const { entry: saved } = await api<{ entry: DiaryEntry }>(`/diary/entries/${day}`, {
        method: "PUT",
        body: { text: text.trim(), mood, promptKey: prompt.key, seconds: seconds > 0 ? seconds : undefined },
      });
      activeMs.current = 0;
      setEntry(saved);
      setText(saved.text);
      setSavedAt(new Date());
      setRestored(false);
      writeDraft(day, "");
      return saved;
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "Não deu para salvar agora. Seu texto continua guardado neste navegador.");
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function review() {
    setError(null);
    if (editable && (dirty || !entry)) {
      const saved = await save();
      if (!saved) return;
    }
    setReviewing(true);
    try {
      const { entry: reviewed } = await api<{ entry: DiaryEntry }>(`/diary/entries/${day}/feedback`, { method: "POST" });
      setEntry(reviewed);
      requestAnimationFrame(() => result.current?.focus());
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "Não deu para corrigir agora. Tente de novo em instantes.");
    } finally {
      setReviewing(false);
    }
  }

  const status = saveStatus({ dirty: dirty && !!text.trim(), saving, savedAt });

  return (
    <div className="mt-6 flex flex-col gap-6">
      <Card tone="lavender" className="p-5">
        <p className="text-sm font-bold text-muted">💭 Tema {view.day === view.today ? "de hoje" : "deste dia"} (opcional)</p>
        <p className="mt-1 font-display text-2xl leading-snug font-semibold text-balance" lang="en">
          {prompt.en}
        </p>
        <p className="mt-1 text-pretty text-muted">{prompt.hint}</p>
        <div className="mt-2">
          <ListenButton text={prompt.en} label="Ouvir o tema" />
        </div>
      </Card>

      {editable ? (
        <section className="flex flex-col gap-4">
          {restored && (
            <p role="status" className="rounded-2xl bg-butter-soft px-4 py-3 font-semibold text-pretty">
              Recuperamos o rascunho que você não chegou a salvar. Confira e clique em Salvar.
            </p>
          )}
          <fieldset>
            <legend className="font-display text-lg font-semibold">Como foi o seu dia?</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {MOODS.map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={mood === option}
                  aria-label={`Humor ${option}`}
                  onClick={() => setMood(mood === option ? null : option)}
                  className={cn("grid size-12 place-items-center rounded-full border-2 text-2xl transition-colors", mood === option ? "border-foreground bg-surface-soft" : "border-border bg-surface hover:border-sky")}
                >
                  <span aria-hidden>{option}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <div>
            <label htmlFor="diary-text" className="font-display text-lg font-semibold">
              Escreva em inglês
            </label>
            <textarea
              id="diary-text"
              value={text}
              onChange={(event) => onChange(event.target.value)}
              rows={10}
              lang="en"
              spellCheck
              placeholder="Today I…"
              aria-describedby="diary-help"
              className="mt-2 min-h-64 w-full resize-y rounded-2xl border-2 border-border bg-surface p-4 text-base leading-relaxed hover:border-sky focus-visible:border-sky focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky/30"
            />
            <div id="diary-help" className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm text-muted">
              <span className={cn(words >= IDEAL_WORDS.min && words <= IDEAL_WORDS.max && "font-bold text-primary")}>
                {words} {words === 1 ? "palavra" : "palavras"} · {lengthHint(words)}
              </span>
              <span>
                {text.length}/{MAX_CHARS}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={() => void save()} disabled={saving || reviewing || !text.trim() || !dirty}>
              {saving ? "Salvando…" : "Salvar"}
            </Button>
            <Button variant="sky" onClick={() => void review()} disabled={saving || reviewing || !text.trim()}>
              {reviewing ? "Corrigindo…" : "Corrigir meu texto"}
            </Button>
            <p role="status" aria-live="polite" className="text-sm font-semibold text-muted">
              {status}
            </p>
          </div>
        </section>
      ) : (
        <section className="flex flex-col gap-3">
          {entry ? (
            <>
              <h2 className="font-display text-xl font-semibold">Seu texto {entry.mood}</h2>
              <p className="rounded-2xl bg-surface-soft px-4 py-3 leading-relaxed whitespace-pre-wrap" lang="en">
                {entry.text}
              </p>
              <div>
                <Button variant="sky" onClick={() => void review()} disabled={reviewing}>
                  {reviewing ? "Corrigindo…" : entry.feedback ? "Corrigir de novo" : "Corrigir meu texto"}
                </Button>
              </div>
            </>
          ) : (
            <p className="rounded-2xl bg-surface-soft px-4 py-3 text-pretty text-muted">Não há texto neste dia, e já passou do prazo para escrever (hoje e os 7 dias anteriores).</p>
          )}
        </section>
      )}

      {error && (
        <p role="alert" className="font-semibold text-coral-edge">
          {error}
        </p>
      )}

      {!aiEnabled && !entry?.feedback && (
        <p className="text-sm text-muted text-pretty">A correção com IA ainda não está ligada neste ambiente: você recebe uma revisão simples, com regras básicas.</p>
      )}

      {entry?.feedback && (
        <div ref={result} tabIndex={-1} className="flex flex-col gap-4 outline-none">
          <h2 className="font-display text-3xl font-semibold">Sua correção</h2>
          <DiaryFeedbackView feedback={entry.feedback} text={entry.text} stale={entry.feedbackStale} onRefresh={() => void review()} busy={reviewing} />
        </div>
      )}

      <p className="text-sm text-muted text-pretty">🔒 Seu diário é privado: só você lê. O texto só vai para a IA quando você clica em “Corrigir meu texto”.</p>
    </div>
  );
}
