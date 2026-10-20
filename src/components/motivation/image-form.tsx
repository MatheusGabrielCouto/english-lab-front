"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ApiError } from "@/lib/api-client";
import { fitWithin, IMAGE_TYPES, MAX_IMAGE_BYTES, megabytes, MAX_IMAGE_SIDE } from "@/lib/motivation-format";
import type { MotivationItem } from "@/lib/motivation-types";
import { uploadMedia } from "@/lib/motivation-upload";

const FIELD =
  "w-full rounded-2xl border-2 border-border bg-surface px-4 py-3 text-base font-normal hover:border-sky focus-visible:border-sky focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky/30";
/** Acima disto (mesmo dentro de 1600 px) a imagem é recomprimida para caber no limite. */
const RECOMPRESS_ABOVE = 3 * 1024 * 1024;

type Prepared = { blob: Blob; type: string; name: string; previewUrl: string };

/** Reduz imagens grandes no navegador (JPEG, fundo branco). GIFs ficam como estão para não perder a animação. */
async function prepare(file: File): Promise<Prepared> {
  if (!(IMAGE_TYPES as readonly string[]).includes(file.type)) throw new Error("Use uma imagem JPG, PNG, WebP ou GIF.");
  const keep = (blob: Blob, type: string, name: string): Prepared => ({ blob, type, name, previewUrl: URL.createObjectURL(blob) });
  if (file.type === "image/gif") {
    if (file.size > MAX_IMAGE_BYTES) throw new Error(`Esse GIF tem ${megabytes(file.size)}. O limite é ${megabytes(MAX_IMAGE_BYTES)}.`);
    return keep(file, file.type, file.name || "imagem.gif");
  }

  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error("Não consegui abrir essa imagem. Tente outro arquivo.");
  });
  const size = fitWithin(bitmap.width, bitmap.height, MAX_IMAGE_SIDE);
  if (!size.resized && file.size <= RECOMPRESS_ABOVE) {
    bitmap.close();
    return keep(file, file.type, file.name || "imagem");
  }

  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Seu navegador não conseguiu preparar a imagem.");
  context.fillStyle = "#fff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
  if (!blob) throw new Error("Seu navegador não conseguiu preparar a imagem.");
  if (blob.size > MAX_IMAGE_BYTES) throw new Error(`Mesmo reduzida, a imagem ficou com ${megabytes(blob.size)}. O limite é ${megabytes(MAX_IMAGE_BYTES)}.`);
  return keep(blob, "image/jpeg", "imagem.jpg");
}

export function ImageForm({ onAdded }: { onAdded: (item: MotivationItem) => void }) {
  const [prepared, setPrepared] = useState<Prepared | null>(null);
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [percent, setPercent] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  // solta o endereço temporário da prévia quando ela muda ou o formulário sai da tela
  useEffect(() => {
    const url = prepared?.previewUrl;
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [prepared]);

  async function choose(file: File | undefined) {
    if (!file) return;
    setError(null);
    setReading(true);
    try {
      setPrepared(await prepare(file));
    } catch (reason) {
      setPrepared(null);
      setError(reason instanceof Error ? reason.message : "Não deu para usar essa imagem.");
    } finally {
      setReading(false);
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!prepared || percent !== null) return;
    setError(null);
    setPercent(0);
    try {
      const item = await uploadMedia({ blob: prepared.blob, contentType: prepared.type, filename: prepared.name, title: title.trim(), text: caption.trim(), onProgress: setPercent });
      onAdded(item);
      setPrepared(null);
      setTitle("");
      setCaption("");
      if (input.current) input.current.value = "";
    } catch (reason) {
      setError(reason instanceof ApiError || reason instanceof Error ? reason.message : "Não deu para enviar agora. Tente de novo.");
    } finally {
      setPercent(null);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-2 font-bold">
        Escolha a imagem
        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={(event) => void choose(event.target.files?.[0])}
          className="rounded-2xl border-2 border-dashed border-border bg-surface px-4 py-3 font-normal file:mr-4 file:rounded-pill file:border-0 file:bg-sky file:px-4 file:py-2 file:font-bold file:text-ink"
        />
        <span className="text-sm font-normal text-muted">JPG, PNG, WebP ou GIF, até {megabytes(MAX_IMAGE_BYTES)}. Imagens grandes são reduzidas sozinhas.</span>
      </label>
      {reading && <p role="status">Preparando a imagem…</p>}
      {prepared && (
        <div className="flex flex-col gap-1">
          {/* prévia local (endereço temporário do navegador) */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={prepared.previewUrl} alt="Prévia da imagem escolhida" className="max-h-64 w-auto max-w-full self-start rounded-2xl border-2 border-border object-contain" />
          <p className="text-sm text-muted">{megabytes(prepared.blob.size)}</p>
        </div>
      )}
      <label className="flex flex-col gap-2 font-bold">
        Título (opcional)
        <input value={title} maxLength={120} onChange={(event) => setTitle(event.target.value)} className={FIELD} />
      </label>
      <label className="flex flex-col gap-2 font-bold">
        Legenda (opcional)
        <input value={caption} maxLength={500} onChange={(event) => setCaption(event.target.value)} placeholder="O que essa imagem te lembra?" className={FIELD} />
      </label>
      {percent !== null && <Progress value={percent} label="Progresso do envio" />}
      {error && (
        <p role="alert" className="font-semibold text-coral-edge">
          {error}
        </p>
      )}
      <div>
        <Button type="submit" disabled={!prepared || percent !== null || reading}>
          {percent !== null ? "Enviando…" : "Adicionar imagem"}
        </Button>
      </div>
    </form>
  );
}
