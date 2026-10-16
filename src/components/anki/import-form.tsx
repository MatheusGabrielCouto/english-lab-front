"use client";

import Link from "next/link";
import { useRef, useState, type DragEvent, type FormEvent } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { upload, ApiError } from "@/lib/api-client";
import type { ImportSummary } from "@/lib/anki-types";
import { cn } from "@/lib/cn";

const MAX_BYTES = 25 * 1024 * 1024;

function size(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const plural = (n: number, one: string, many: string) => `${n.toLocaleString("pt-BR")} ${n === 1 ? one : many}`;

export function ImportForm({ decks }: { decks: { id: string; fullName: string }[] }) {
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [targetDeckId, setTargetDeckId] = useState("");
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const [result, setResult] = useState<ImportSummary>();

  function choose(next: File | undefined) {
    setResult(undefined);
    setError(undefined);
    if (next && next.size > MAX_BYTES) {
      setFile(null);
      setError(`O arquivo tem ${size(next.size)}; o limite é ${size(MAX_BYTES)}.`);
      return;
    }
    setFile(next ?? null);
  }

  function onDrop(event: DragEvent) {
    event.preventDefault();
    setDragging(false);
    choose(event.dataTransfer.files[0]);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!file) return;
    setPending(true);
    setError(undefined);
    setResult(undefined);
    try {
      const form = new FormData();
      form.set("file", file);
      if (targetDeckId) form.set("targetDeckId", targetDeckId);
      form.set("skipDuplicates", String(skipDuplicates));
      setResult(await upload<ImportSummary>("/anki/import", form));
      setFile(null);
      if (input.current) input.current.value = "";
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.status === 413
            ? "O arquivo é grande demais (máximo de 25 MB)."
            : (e.errors[0]?.message ?? e.message)
          : "Não consegui enviar o arquivo. Tente de novo.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <label
          htmlFor="import-file"
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={cn(
            "flex cursor-pointer flex-col items-center gap-1 rounded-card border-2 border-dashed px-6 py-10 text-center transition-colors",
            dragging ? "border-sky bg-sky-soft" : "border-border bg-surface hover:border-sky hover:bg-surface-soft",
          )}
        >
          <span aria-hidden className="text-3xl">
            📥
          </span>
          {file ? (
            <>
              <span className="font-display text-xl font-semibold break-all">{file.name}</span>
              <span className="text-sm text-muted">{size(file.size)} · clique para trocar</span>
            </>
          ) : (
            <>
              <span className="font-display text-xl font-semibold">Arraste o arquivo aqui</span>
              <span className="text-sm text-muted">ou clique para escolher · .apkg, .csv, .tsv ou .txt até 25 MB</span>
            </>
          )}
          <input
            ref={input}
            id="import-file"
            type="file"
            accept=".apkg,.colpkg,.csv,.tsv,.txt"
            onChange={(event) => choose(event.target.files?.[0])}
            className="sr-only"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 font-display text-base font-semibold">
            Importar para
            <select
              value={targetDeckId}
              onChange={(event) => setTargetDeckId(event.target.value)}
              className="h-12 rounded-2xl border-2 border-border bg-surface px-4 font-sans text-base font-normal hover:border-sky focus-visible:border-sky focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky/30"
            >
              <option value="">Criar baralhos a partir do arquivo</option>
              {decks.map((deck) => (
                <option key={deck.id} value={deck.id}>
                  Dentro de: {deck.fullName.split("::").join(" › ")}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-start gap-3 rounded-2xl bg-surface-soft p-4 sm:mt-7">
            <input
              type="checkbox"
              checked={skipDuplicates}
              onChange={(event) => setSkipDuplicates(event.target.checked)}
              className="mt-0.5 size-5 shrink-0 accent-primary"
            />
            <span>
              <span className="font-semibold">Pular cartões repetidos</span>
              <span className="block text-sm text-muted">Não duplica o que já existe no mesmo baralho.</span>
            </span>
          </label>
        </div>

        <p role="alert" className="min-h-5 text-sm font-semibold text-coral-edge">
          {error}
        </p>

        <div>
          <Button type="submit" size="lg" disabled={!file || pending}>
            {pending ? "Importando…" : "Importar"}
          </Button>
        </div>
      </form>

      {result && (
        <Card tone="primary" className="mt-6" role="status">
          <h3 className="font-display text-2xl font-semibold">
            {result.notesImported > 0 ? "Importação concluída! 🎉" : "Nada novo para importar"}
          </h3>
          <ul className="mt-3 flex flex-col gap-1">
            <li>
              <strong>{plural(result.notesImported, "nota importada", "notas importadas")}</strong> (
              {plural(result.cardsCreated, "cartão", "cartões")})
            </li>
            {result.decksCreated > 0 && <li>{plural(result.decksCreated, "baralho criado", "baralhos criados")}</li>}
            {result.skippedDuplicates > 0 && (
              <li>{plural(result.skippedDuplicates, "nota repetida foi pulada", "notas repetidas foram puladas")}</li>
            )}
            {result.skippedInvalid > 0 && (
              <li>{plural(result.skippedInvalid, "linha sem conteúdo foi ignorada", "linhas sem conteúdo foram ignoradas")}</li>
            )}
            {result.ignoredMedia > 0 && (
              <li>
                {plural(result.ignoredMedia, "imagem ou áudio", "imagens ou áudios")} não {result.ignoredMedia === 1 ? "foi importado" : "foram importados"}{" "}
                (só o texto entra).
              </li>
            )}
            {result.truncated > 0 && (
              <li>{plural(result.truncated, "campo foi cortado", "campos foram cortados")} em 2000 caracteres.</li>
            )}
          </ul>
          <p className="mt-3 text-sm text-muted">Os cartões entram como novos: o progresso do outro app não é copiado.</p>
          {result.deckId && (
            <div className="mt-4 flex flex-wrap gap-3">
              <ButtonLink href={`/anki/baralho/${result.deckId}`}>Abrir baralho</ButtonLink>
              <Link
                href="/anki"
                className="inline-flex h-11 items-center rounded-pill px-4 font-semibold text-muted hover:text-foreground"
              >
                Ver todos os baralhos
              </Link>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
