"use client";

import { useState } from "react";
import { AudioRecorder } from "@/components/motivation/audio-recorder";
import { ImageForm } from "@/components/motivation/image-form";
import { QuoteForm } from "@/components/motivation/quote-form";
import { VideoForm } from "@/components/motivation/video-form";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import type { MotivationItem, MotivationType } from "@/lib/motivation-types";

const TABS: { type: MotivationType; label: string; emoji: string }[] = [
  { type: "QUOTE", label: "Frase", emoji: "✍️" },
  { type: "IMAGE", label: "Imagem", emoji: "🖼️" },
  { type: "VIDEO", label: "Vídeo", emoji: "▶️" },
  { type: "AUDIO", label: "Áudio", emoji: "🎙️" },
];

/** Adicionar ao mural: uma aba para cada tipo de item. */
export function AddItem({ mediaEnabled, onAdded }: { mediaEnabled: boolean; onAdded: (item: MotivationItem) => void }) {
  const [type, setType] = useState<MotivationType>("QUOTE");
  const [added, setAdded] = useState<string | null>(null);
  const needsStorage = (type === "IMAGE" || type === "AUDIO") && !mediaEnabled;

  function handleAdded(item: MotivationItem) {
    onAdded(item);
    setAdded(item.id);
  }

  return (
    <Card className="p-5 md:p-6">
      <div role="group" aria-label="Tipo de item" className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.type}
            type="button"
            aria-pressed={type === tab.type}
            onClick={() => {
              setType(tab.type);
              setAdded(null);
            }}
            className={cn(
              "rounded-pill border-2 px-4 py-2 font-bold transition-colors",
              type === tab.type ? "border-foreground bg-foreground text-background" : "border-border bg-surface text-muted hover:border-sky hover:text-foreground",
            )}
          >
            <span aria-hidden>{tab.emoji}</span> {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {needsStorage ? (
          <p className="rounded-2xl bg-butter-soft px-4 py-3 text-pretty" role="note">
            O armazenamento de arquivos ainda não está configurado neste ambiente, então imagens e áudios não podem ser enviados. Frases e vídeos funcionam normalmente.
          </p>
        ) : type === "QUOTE" ? (
          <QuoteForm onAdded={handleAdded} />
        ) : type === "IMAGE" ? (
          <ImageForm onAdded={handleAdded} />
        ) : type === "VIDEO" ? (
          <VideoForm onAdded={handleAdded} />
        ) : (
          <AudioRecorder onAdded={handleAdded} />
        )}
      </div>

      {added && (
        <p role="status" className="mt-4 font-bold text-primary">
          ✅ Adicionado ao seu mural!
        </p>
      )}
    </Card>
  );
}
