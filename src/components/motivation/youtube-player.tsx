"use client";

import { useState } from "react";
import { embedUrl, thumbnailUrl, watchUrl } from "@/lib/motivation-format";

/** A miniatura do vídeo; o player do YouTube só carrega quando o aluno clica (nada de rastreamento antes). */
export function YouTubePlayer({ videoId, title }: { videoId: string; title: string }) {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="aspect-video overflow-hidden rounded-2xl bg-ink">
      {playing ? (
        <iframe
          src={embedUrl(videoId)}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className="size-full"
        />
      ) : (
        <button type="button" onClick={() => setPlaying(true)} aria-label={`Assistir: ${title}`} className="group relative block size-full">
          {/* miniatura do YouTube; next/image não ajuda com um domínio externo */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={thumbnailUrl(videoId)} alt="" loading="lazy" className="size-full object-cover" />
          <span aria-hidden className="absolute inset-0 grid place-items-center bg-black/25 transition-colors group-hover:bg-black/10">
            <span className="grid size-16 place-items-center rounded-full bg-coral text-3xl text-ink shadow-[0_4px_0_0_var(--color-coral-edge)]">▶</span>
          </span>
        </button>
      )}
      {!playing && (
        <a href={watchUrl(videoId)} target="_blank" rel="noopener noreferrer" className="sr-only">
          Abrir no YouTube
        </a>
      )}
    </div>
  );
}
