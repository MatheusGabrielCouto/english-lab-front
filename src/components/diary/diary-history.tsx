"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ApiError, api } from "@/lib/api-client";
import { cn } from "@/lib/cn";
import { formatDiaryDay, formatMonthKey, monthGrid, monthOf, shiftMonth } from "@/lib/diary-format";
import type { DiaryListItem } from "@/lib/diary-types";
import { WEEKDAYS } from "@/lib/checklist-format";

/** O histórico: calendário do mês com os dias escritos, lista de entradas e busca por texto. */
export function DiaryHistory({ today, initial }: { today: string; initial: DiaryListItem[] }) {
  const [month, setMonth] = useState(monthOf(today));
  const [entries, setEntries] = useState(initial);
  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const request = useRef(0);

  async function load(path: string) {
    const id = ++request.current;
    setLoading(true);
    setError(null);
    try {
      const { entries: next } = await api<{ entries: DiaryListItem[] }>(path);
      if (id === request.current) setEntries(next);
    } catch (reason) {
      if (id === request.current) setError(reason instanceof ApiError ? reason.message : "Não deu para carregar agora. Tente de novo.");
    } finally {
      if (id === request.current) setLoading(false);
    }
  }

  function goTo(next: string) {
    setMonth(next);
    setSearched(null);
    setQuery("");
    void load(`/diary/entries?month=${next}`);
  }

  function search(event: React.FormEvent) {
    event.preventDefault();
    const term = query.trim();
    if (term.length < 2) return;
    setSearched(term);
    void load(`/diary/entries?q=${encodeURIComponent(term)}`);
  }

  const written = new Map(entries.map((entry) => [entry.day, entry]));
  const isCurrentMonth = month === monthOf(today);

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
      <Card className="h-fit p-5">
        <div className="flex items-center justify-between gap-2">
          <button type="button" onClick={() => goTo(shiftMonth(month, -1))} aria-label="Mês anterior" className="grid size-10 place-items-center rounded-full text-xl transition-colors hover:bg-surface-soft">
            ‹
          </button>
          <h2 className="font-display text-xl font-semibold" aria-live="polite">
            {formatMonthKey(month)}
          </h2>
          <button
            type="button"
            onClick={() => goTo(shiftMonth(month, 1))}
            disabled={isCurrentMonth}
            aria-label="Próximo mês"
            className="grid size-10 place-items-center rounded-full text-xl transition-colors hover:bg-surface-soft disabled:opacity-30"
          >
            ›
          </button>
        </div>
        <div className="mt-3 grid grid-cols-7 gap-1.5 text-center" role="table" aria-label="Dias escritos no mês">
          {WEEKDAYS.map((label, index) => (
            <div key={index} aria-hidden className="text-xs font-bold text-muted">
              {label}
            </div>
          ))}
          {monthGrid(month)
            .flat()
            .map((day, index) => {
              if (!day) return <div key={index} aria-hidden />;
              const entry = searched ? undefined : written.get(day);
              const content = (
                <>
                  <span aria-hidden>{Number(day.slice(8))}</span>
                  <span className="sr-only">{`dia ${Number(day.slice(8))}${entry ? ": escrito" : ""}`}</span>
                </>
              );
              const tone = cn("grid aspect-square place-items-center rounded-xl text-sm tabular-nums", day === today && "ring-2 ring-foreground/50", day > today && "text-muted/50");
              return entry ? (
                <Link key={day} href={`/diario/${day}`} className={cn(tone, "bg-primary font-bold text-on-primary transition-[filter] hover:brightness-105")}>
                  {content}
                </Link>
              ) : (
                <div key={day} role="cell" className={cn(tone, "bg-surface-soft text-muted")}>
                  {content}
                </div>
              );
            })}
        </div>
        <p className="mt-3 text-sm text-muted">
          {searched ? "Mostrando o resultado da busca." : `${entries.length} ${entries.length === 1 ? "dia escrito" : "dias escritos"} neste mês.`}
        </p>
      </Card>

      <section>
        <form onSubmit={search} className="flex flex-wrap gap-3" role="search">
          <label htmlFor="diary-search" className="sr-only">
            Buscar no diário
          </label>
          <input
            id="diary-search"
            type="search"
            value={query}
            maxLength={80}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar uma palavra nos seus textos"
            className="h-11 min-w-0 flex-1 basis-56 rounded-2xl border-2 border-border bg-surface px-4 hover:border-sky focus-visible:border-sky focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky/30"
          />
          <Button type="submit" variant="sky" disabled={query.trim().length < 2 || loading}>
            Buscar
          </Button>
          {searched && (
            <Button type="button" variant="ghost" onClick={() => goTo(month)}>
              Limpar
            </Button>
          )}
        </form>

        {error && (
          <p role="alert" className="mt-3 font-semibold text-coral-edge">
            {error}
          </p>
        )}

        <h2 className="mt-6 font-display text-2xl font-semibold">{searched ? `Resultados para “${searched}”` : "Entradas do mês"}</h2>
        <div aria-busy={loading} className={cn("mt-3", loading && "opacity-60")}>
          {entries.length === 0 ? (
            <p className="rounded-2xl bg-surface-soft px-4 py-3 text-pretty text-muted">
              {searched ? "Nenhum texto com essa palavra." : "Nenhuma entrada neste mês."}{" "}
              {!searched && isCurrentMonth && (
                <Link href="/diario" className="font-bold text-foreground underline underline-offset-4">
                  Escrever agora
                </Link>
              )}
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {entries.map((entry) => (
                <li key={entry.day}>
                  <Link href={`/diario/${entry.day}`} className="block rounded-card border-2 border-border bg-surface p-4 transition-colors hover:border-sky">
                    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-bold text-muted">
                      <span>
                        {entry.mood && <span aria-hidden>{entry.mood} </span>}
                        {formatDiaryDay(entry.day)}
                      </span>
                      <span>{entry.wordCount} palavras</span>
                      {entry.hasFeedback && <span className="rounded-pill bg-sky-soft px-2 py-0.5 text-foreground">corrigido</span>}
                    </p>
                    <p className="mt-1 text-pretty" lang="en">
                      {entry.preview}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
