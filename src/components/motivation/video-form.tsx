"use client";

import { useState } from "react";
import { YouTubePlayer } from "@/components/motivation/youtube-player";
import { Button } from "@/components/ui/button";
import { ApiError, api } from "@/lib/api-client";
import { parseYoutubeId } from "@/lib/motivation-format";
import type { MotivationItem } from "@/lib/motivation-types";

const FIELD =
  "w-full rounded-2xl border-2 border-border bg-surface px-4 py-3 text-base font-normal hover:border-sky focus-visible:border-sky focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky/30";

export function VideoForm({ onAdded }: { onAdded: (item: MotivationItem) => void }) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const videoId = parseYoutubeId(url);
  const invalid = url.trim().length > 0 && !videoId;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy || !videoId) return;
    setBusy(true);
    setError(null);
    try {
      const { item } = await api<{ item: MotivationItem }>("/motivation/videos", { method: "POST", body: { url: url.trim(), title: title.trim() || undefined } });
      onAdded(item);
      setUrl("");
      setTitle("");
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "Não deu para salvar agora. Tente de novo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-2 font-bold">
        Link do vídeo no YouTube
        <input
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          inputMode="url"
          autoComplete="off"
          placeholder="https://www.youtube.com/watch?v=…"
          aria-invalid={invalid}
          aria-describedby="video-help"
          className={FIELD}
        />
      </label>
      <p id="video-help" role="status" className={invalid ? "font-semibold text-coral-edge" : "text-sm text-muted"}>
        {invalid ? "Esse link não parece ser do YouTube. Use youtube.com ou youtu.be." : videoId ? "Link reconhecido ✓" : "Funciona com links de vídeo, Shorts e do botão Compartilhar."}
      </p>
      {videoId && (
        <div className="max-w-md">
          <YouTubePlayer key={videoId} videoId={videoId} title="Prévia do vídeo" />
        </div>
      )}
      <label className="flex flex-col gap-2 font-bold">
        Título (opcional)
        <input value={title} maxLength={120} onChange={(event) => setTitle(event.target.value)} placeholder="Por que esse vídeo te motiva?" className={FIELD} />
      </label>
      {error && (
        <p role="alert" className="font-semibold text-coral-edge">
          {error}
        </p>
      )}
      <div>
        <Button type="submit" disabled={busy || !videoId}>
          {busy ? "Salvando…" : "Adicionar vídeo"}
        </Button>
      </div>
    </form>
  );
}
