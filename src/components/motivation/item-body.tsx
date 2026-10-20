"use client";

import { useRef } from "react";
import { YouTubePlayer } from "@/components/motivation/youtube-player";
import { cn } from "@/lib/cn";
import { formatDuration } from "@/lib/motivation-format";
import type { MotivationItem } from "@/lib/motivation-types";

/** Uma imagem que abre ampliada ao clicar (um <dialog> nativo: Esc fecha e o foco fica preso). */
function ZoomableImage({ src, alt, large }: { src: string; alt: string; large?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button type="button" onClick={() => dialog.current?.showModal()} aria-label={`Ampliar: ${alt}`} className="block w-full cursor-zoom-in overflow-hidden rounded-2xl">
        {/* a imagem vem do bucket por link temporário; next/image não ajuda com URLs assinadas */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} loading="lazy" className={cn("w-full object-cover", large ? "max-h-[28rem]" : "max-h-80")} />
      </button>
      <dialog
        ref={dialog}
        onClick={(event) => event.target === dialog.current && dialog.current?.close()}
        aria-label={alt}
        className="m-auto max-h-[92dvh] max-w-[min(96vw,64rem)] rounded-card border-2 border-border bg-surface p-2 backdrop:bg-black/70"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className="max-h-[84dvh] w-auto max-w-full rounded-2xl object-contain" />
        <form method="dialog" className="mt-2 flex justify-end">
          <button className="rounded-pill bg-surface-soft px-4 py-2 font-bold transition-colors hover:bg-sky">Fechar</button>
        </form>
      </dialog>
    </>
  );
}

/** O conteúdo de um item (sem os botões de ação): serve para o mural e para o "Me motive agora". */
export function ItemBody({ item, large = false }: { item: MotivationItem; large?: boolean }) {
  const label = item.title || item.text || "Imagem do seu mural";

  if (item.type === "QUOTE") {
    return (
      <figure>
        <blockquote className={cn("font-display leading-snug font-semibold text-balance", large ? "text-3xl md:text-4xl" : "text-2xl")} lang="en">
          “{item.text}”
        </blockquote>
        {item.author && <figcaption className="mt-3 font-bold text-muted">— {item.author}</figcaption>}
      </figure>
    );
  }

  if (item.type === "IMAGE") {
    return (
      <div className="flex flex-col gap-3">
        {item.title && <p className="font-display text-xl font-semibold text-balance">{item.title}</p>}
        {item.mediaUrl ? <ZoomableImage src={item.mediaUrl} alt={label} large={large} /> : <p className="text-muted">A imagem não está disponível agora.</p>}
        {item.text && <p className="text-pretty">{item.text}</p>}
      </div>
    );
  }

  if (item.type === "VIDEO" && item.videoId) {
    return (
      <div className="flex flex-col gap-3">
        <YouTubePlayer videoId={item.videoId} title={item.title || "Vídeo do YouTube"} />
        {item.title && <p className="font-display text-xl font-semibold text-balance">{item.title}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="flex items-center gap-2 font-display text-xl font-semibold text-balance">
        <span aria-hidden>🎙️</span>
        {item.title || "Áudio gravado por mim"}
        {item.durationSec ? <span className="text-base font-bold text-muted">· {formatDuration(item.durationSec)}</span> : null}
      </p>
      {item.mediaUrl ? (
        <audio controls preload="none" src={item.mediaUrl} className="w-full" aria-label={item.title || "Áudio gravado por mim"} />
      ) : (
        <p className="text-muted">O áudio não está disponível agora.</p>
      )}
    </div>
  );
}
