"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { cn } from "@/lib/cn";

/** Só o que usamos da Web Speech API (o TypeScript não traz esses tipos). */
interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}
type RecognitionConstructor = new () => Recognition;

function recognitionConstructor(): RecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const scope = window as unknown as { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor };
  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition ?? null;
}

const ERRORS: Record<string, string> = {
  "not-allowed": "O navegador não deixou usar o microfone. Libere o acesso nas permissões do site.",
  "service-not-allowed": "O navegador não deixou usar o microfone. Libere o acesso nas permissões do site.",
  "no-speech": "Não ouvi nada. Fale mais perto do microfone e tente de novo.",
  "audio-capture": "Não encontrei um microfone neste dispositivo.",
  network: "O reconhecimento de voz precisa de internet.",
};

/**
 * Botão "Falar": transcreve o que a pessoa diz em inglês e entrega cada frase pronta em `onText`.
 * Some se o navegador não tiver reconhecimento de voz (por exemplo, o Firefox).
 */
export function VoiceInput({ onText, disabled }: { onText: (text: string) => void; disabled?: boolean }) {
  // no servidor (e na primeira pintura) não sabemos; só o navegador responde
  const supported = useSyncExternalStore(
    () => () => {},
    () => recognitionConstructor() !== null,
    () => false,
  );
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognition = useRef<Recognition | null>(null);
  const handler = useRef(onText);

  useEffect(() => {
    handler.current = onText;
  }, [onText]);

  useEffect(() => () => recognition.current?.stop(), []);

  if (!supported) return null;

  function start() {
    const Constructor = recognitionConstructor();
    if (!Constructor) return;
    setError(null);
    const instance = new Constructor();
    instance.lang = "en-US";
    instance.continuous = true;
    instance.interimResults = true;
    instance.onresult = (event) => {
      let partial = "";
      for (let index = event.resultIndex; index < event.results.length; index++) {
        const result = event.results[index];
        if (result.isFinal) handler.current(result[0].transcript.trim());
        else partial += result[0].transcript;
      }
      setInterim(partial);
    };
    instance.onerror = (event) => {
      if (event.error !== "aborted") setError(ERRORS[event.error] ?? "Não consegui ouvir agora. Tente de novo.");
    };
    instance.onend = () => {
      setListening(false);
      setInterim("");
    };
    recognition.current = instance;
    instance.start();
    setListening(true);
  }

  function stop() {
    recognition.current?.stop();
  }

  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        onClick={listening ? stop : start}
        disabled={disabled}
        aria-pressed={listening}
        className={cn(
          "inline-flex h-11 items-center gap-2 self-start rounded-pill border-2 px-4 text-sm font-bold transition-colors disabled:opacity-50",
          listening ? "border-coral bg-coral-soft text-foreground" : "border-border bg-surface text-muted hover:border-sky hover:text-foreground",
        )}
      >
        <span aria-hidden className={cn(listening && "animate-pulse")}>
          🎤
        </span>
        {listening ? "Parar de gravar" : "Responder falando"}
      </button>
      {listening && (
        <p className="text-sm text-muted" aria-live="polite">
          Ouvindo… fale em inglês. {interim && <em className="not-italic text-foreground">{interim}</em>}
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm font-semibold text-coral-edge">
          {error}
        </p>
      )}
    </div>
  );
}
