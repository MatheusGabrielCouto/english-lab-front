"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NoteEditor } from "@/components/anki/note-editor";
import { NoteContent, noteLabel, TypeBadge } from "@/components/anki/note-view";
import { Mascot } from "@/components/mascot";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api, ApiError } from "@/lib/api-client";
import { NOTE_TYPE_LABEL, type NoteType, type SearchedNote, type SearchPage } from "@/lib/anki-types";
import { cn } from "@/lib/cn";

type Filters = {
  q: string;
  deckId: string;
  type: "" | NoteType;
  status: "" | "new" | "learning" | "review" | "suspended";
  tag: string;
};

const STATUS_LABEL: Record<Exclude<Filters["status"], "">, string> = {
  new: "Novos",
  learning: "Aprendendo",
  review: "Em revisão",
  suspended: "Suspensos",
};

function toQuery(filters: Filters, cursor?: string | null) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) if (value.trim()) params.set(key, value.trim());
  if (cursor) params.set("cursor", cursor);
  return params.toString();
}

const CONTROL =
  "h-11 rounded-2xl border-2 border-border bg-surface px-3 text-base hover:border-sky focus-visible:border-sky focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky/30";

export function CardBrowser({
  decks,
  initialFilters,
  initial,
}: {
  decks: { id: string; fullName: string }[];
  initialFilters: Filters;
  initial: SearchPage;
}) {
  const [filters, setFilters] = useState(initialFilters);
  const [notes, setNotes] = useState(initial.notes);
  const [cursor, setCursor] = useState(initial.nextCursor);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [moveTo, setMoveTo] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string }>();
  const latest = useRef(0);
  const firstRun = useRef(true);

  const deckName = useMemo(() => new Map(decks.map((deck) => [deck.id, deck.fullName])), [decks]);

  const fail = (e: unknown, fallback: string) =>
    setMessage({ ok: false, text: e instanceof ApiError ? e.message : fallback });

  /** Busca a primeira página com os filtros atuais, ignorando respostas atrasadas. */
  const run = useCallback(async (next: Filters) => {
    const ticket = ++latest.current;
    setLoading(true);
    try {
      const page = await api<SearchPage>(`/anki/notes?${toQuery(next)}`);
      if (ticket !== latest.current) return;
      setNotes(page.notes);
      setCursor(page.nextCursor);
      setSelected(new Set());
    } catch (e) {
      if (ticket === latest.current) fail(e, "Não consegui buscar.");
    } finally {
      if (ticket === latest.current) setLoading(false);
    }
  }, []);

  // refaz a busca ao mudar um filtro (texto com atraso, para não buscar a cada tecla)
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const timer = setTimeout(() => void run(filters), 300);
    return () => clearTimeout(timer);
  }, [filters, run]);

  const set = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    setFilters((current) => ({ ...current, [key]: value }));

  async function loadMore() {
    if (!cursor) return;
    try {
      const page = await api<SearchPage>(`/anki/notes?${toQuery(filters, cursor)}`);
      setNotes((current) => [...current, ...page.notes]);
      setCursor(page.nextCursor);
    } catch (e) {
      fail(e, "Não consegui carregar mais.");
    }
  }

  async function toggleSuspend(note: SearchedNote) {
    const suspended = note.suspendedCards === 0;
    try {
      await api(`/anki/notes/${note.id}/suspend`, { method: "POST", body: { suspended } });
      setNotes((current) =>
        current.map((item) => (item.id === note.id ? { ...item, suspendedCards: suspended ? item.cardCount : 0 } : item)),
      );
    } catch (e) {
      fail(e, "Não consegui suspender.");
    }
  }

  async function removeOne(note: SearchedNote) {
    if (!window.confirm("Apagar esta nota e todos os cartões dela?")) return;
    try {
      await api(`/anki/notes/${note.id}`, { method: "DELETE" });
      setNotes((current) => current.filter((item) => item.id !== note.id));
      setSelected((current) => {
        const next = new Set(current);
        next.delete(note.id);
        return next;
      });
    } catch (e) {
      fail(e, "Não consegui apagar.");
    }
  }

  async function bulk(action: "delete" | "suspend" | "unsuspend" | "move") {
    const ids = [...selected];
    if (ids.length === 0) return;
    if (action === "delete" && !window.confirm(`Apagar ${ids.length} ${ids.length === 1 ? "nota" : "notas"} e os cartões delas?`)) {
      return;
    }
    try {
      const { affected } = await api<{ affected: number }>("/anki/notes/bulk", {
        method: "POST",
        body: { ids, action, ...(action === "move" && { deckId: moveTo }) },
      });
      setMessage({ ok: true, text: `${affected} ${affected === 1 ? "nota atualizada" : "notas atualizadas"}.` });
      setMoveTo("");
      await run(filters);
    } catch (e) {
      fail(e, "Não consegui concluir a ação.");
    }
  }

  const allSelected = notes.length > 0 && notes.every((note) => selected.has(note.id));

  return (
    <div>
      {/* Filtros: uma linha acima dos resultados, valendo para tudo abaixo */}
      <section aria-label="Filtros" className="flex flex-col gap-3">
        <div>
          <label htmlFor="browse-q" className="sr-only">
            Buscar
          </label>
          <input
            id="browse-q"
            type="search"
            value={filters.q}
            onChange={(e) => set("q", e.target.value)}
            placeholder="Buscar em frente, verso, dicas e tags…"
            className={cn(CONTROL, "h-12 w-full")}
          />
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <label className="col-span-2 flex flex-col gap-1 text-sm font-semibold sm:col-span-1">
            Baralho
            <select value={filters.deckId} onChange={(e) => set("deckId", e.target.value)} className={CONTROL}>
              <option value="">Todos</option>
              {decks.map((deck) => (
                <option key={deck.id} value={deck.id}>
                  {deck.fullName.split("::").join(" › ")}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold">
            Tipo
            <select value={filters.type} onChange={(e) => set("type", e.target.value as Filters["type"])} className={CONTROL}>
              <option value="">Todos</option>
              {(Object.keys(NOTE_TYPE_LABEL) as NoteType[]).map((type) => (
                <option key={type} value={type}>
                  {NOTE_TYPE_LABEL[type]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold">
            Situação
            <select value={filters.status} onChange={(e) => set("status", e.target.value as Filters["status"])} className={CONTROL}>
              <option value="">Todas</option>
              {(Object.keys(STATUS_LABEL) as (keyof typeof STATUS_LABEL)[]).map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABEL[status]}
                </option>
              ))}
            </select>
          </label>
          <label className="col-span-2 flex flex-col gap-1 text-sm font-semibold sm:col-span-1">
            Tag
            <input
              value={filters.tag}
              onChange={(e) => set("tag", e.target.value)}
              placeholder="ex.: verbo"
              maxLength={40}
              className={CONTROL}
            />
          </label>
        </div>
      </section>

      <p role="status" className={cn("mt-4 min-h-5 text-sm font-semibold", message && !message.ok ? "text-coral-edge" : "text-primary")}>
        {message?.text}
      </p>

      {/* Barra de ações em lote */}
      {notes.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-3 rounded-2xl bg-surface-soft px-4 py-3">
          <label className="flex items-center gap-2 font-semibold">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={(e) => setSelected(e.target.checked ? new Set(notes.map((note) => note.id)) : new Set())}
              className="size-5 accent-primary"
            />
            {selected.size > 0 ? `${selected.size} selecionada${selected.size === 1 ? "" : "s"}` : "Selecionar tudo"}
          </label>

          {selected.size > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="ghost" className="h-9 px-4 text-sm" onClick={() => void bulk("suspend")}>
                Suspender
              </Button>
              <Button variant="ghost" className="h-9 px-4 text-sm" onClick={() => void bulk("unsuspend")}>
                Reativar
              </Button>
              <select
                aria-label="Mover para o baralho"
                value={moveTo}
                onChange={(e) => setMoveTo(e.target.value)}
                className={cn(CONTROL, "h-9 text-sm")}
              >
                <option value="">Mover para…</option>
                {decks.map((deck) => (
                  <option key={deck.id} value={deck.id}>
                    {deck.fullName.split("::").join(" › ")}
                  </option>
                ))}
              </select>
              <Button variant="ghost" className="h-9 px-4 text-sm" disabled={!moveTo} onClick={() => void bulk("move")}>
                Mover
              </Button>
              <Button variant="coral" className="h-9 px-4 text-sm" onClick={() => void bulk("delete")}>
                Apagar
              </Button>
            </div>
          ) : (
            <span className="text-sm text-muted">
              {notes.length} {notes.length === 1 ? "resultado" : "resultados"}
              {cursor && "+"}
            </span>
          )}
        </div>
      )}

      {/* Resultados: durante a busca mantêm o quadro, só ficam mais claros */}
      <div className={cn("mt-4 transition-opacity duration-150", loading && "opacity-50")} aria-busy={loading}>
        {notes.length === 0 ? (
          <div className="flex flex-col items-center rounded-card border-2 border-dashed border-border px-6 py-12 text-center">
            <Mascot className="w-28 motion-safe:animate-float" />
            <p className="mt-3 font-display text-xl font-semibold">Nada encontrado</p>
            <p className="mt-1 text-muted text-pretty">Tente outra palavra ou limpe os filtros.</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {notes.map((note) => (
              <li key={note.id}>
                <Card className={cn("p-4", note.suspendedCards > 0 && "opacity-75")}>
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selected.has(note.id)}
                      onChange={(e) =>
                        setSelected((current) => {
                          const next = new Set(current);
                          if (e.target.checked) next.add(note.id);
                          else next.delete(note.id);
                          return next;
                        })
                      }
                      aria-label={`Selecionar ${noteLabel(note)}`}
                      className="mt-1 size-5 shrink-0 accent-primary"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <TypeBadge note={note} />
                          <Link
                            href={`/anki/baralho/${note.deckId}`}
                            className="rounded-pill bg-surface-soft px-3 py-0.5 text-xs font-bold text-muted hover:text-foreground"
                          >
                            {(deckName.get(note.deckId) ?? note.deckName).split("::").join(" › ")}
                          </Link>
                          {note.suspendedCards > 0 && (
                            <span className="rounded-pill bg-coral-soft px-3 py-0.5 text-xs font-bold">Suspensa</span>
                          )}
                        </div>
                        {editingId !== note.id && (
                          <div className="flex shrink-0 gap-1">
                            <button
                              type="button"
                              onClick={() => setEditingId(note.id)}
                              aria-label={`Editar a nota ${noteLabel(note)}`}
                              className="rounded-pill px-3 py-1 text-sm font-semibold text-muted transition-colors hover:bg-sky-soft hover:text-foreground"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => void toggleSuspend(note)}
                              aria-label={`${note.suspendedCards > 0 ? "Reativar" : "Suspender"} a nota ${noteLabel(note)}`}
                              className="rounded-pill px-3 py-1 text-sm font-semibold text-muted transition-colors hover:bg-butter-soft hover:text-foreground"
                            >
                              {note.suspendedCards > 0 ? "Reativar" : "Suspender"}
                            </button>
                            <button
                              type="button"
                              onClick={() => void removeOne(note)}
                              aria-label={`Apagar a nota ${noteLabel(note)}`}
                              className="rounded-pill px-3 py-1 text-sm font-semibold text-muted transition-colors hover:bg-coral-soft hover:text-foreground"
                            >
                              Apagar
                            </button>
                          </div>
                        )}
                      </div>

                      {editingId === note.id ? (
                        <NoteEditor
                          note={note}
                          decks={decks}
                          onCancel={() => setEditingId(null)}
                          onSaved={(saved) => {
                            setEditingId(null);
                            const old = note;
                            setNotes((current) =>
                              current.map((item) =>
                                item.id === saved.id
                                  ? { ...item, ...saved, deckName: deckName.get(saved.deckId) ?? item.deckName }
                                  : item,
                              ),
                            );
                            // lacunas novas/removidas mudam os cartões: recarrega para refletir a situação
                            if (saved.cardCount !== old.cardCount) void run(filters);
                          }}
                        />
                      ) : (
                        <NoteContent note={note} />
                      )}
                    </div>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}

        {cursor && (
          <Button variant="ghost" className="mt-5" onClick={() => void loadMore()}>
            Carregar mais
          </Button>
        )}
      </div>
    </div>
  );
}
