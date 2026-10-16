"use client";

import { speak, useEnglishVoices, useSpeechSettings } from "@/lib/speech";

/** "Ouvir em inglês" + escolha de voz e velocidade (lembradas neste navegador). */
export function VoiceButton({ text }: { text: string }) {
  const voices = useEnglishVoices();
  const [settings, update] = useSpeechSettings();

  // sem suporte a fala no navegador
  if (voices.length === 0) return null;

  const selected =
    voices.find((voice) => voice.voiceURI === settings.voiceURI) ?? voices[0];

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => speak(text, settings, voices)}
        className="inline-flex items-center gap-2 rounded-pill px-4 py-2 text-sm font-semibold text-muted transition-colors hover:bg-surface-soft hover:text-foreground"
      >
        <span aria-hidden>🔊</span> Ouvir em inglês
      </button>

      <details className="group w-full max-w-xs text-sm">
        <summary className="mx-auto w-fit cursor-pointer list-none rounded-pill px-3 py-1 font-semibold text-muted transition-colors hover:bg-surface-soft hover:text-foreground [&::-webkit-details-marker]:hidden">
          Voz e velocidade
        </summary>

        <div className="mt-2 flex flex-col gap-3 rounded-2xl border-2 border-border bg-surface-soft p-4 text-left">
          <label className="flex flex-col gap-1">
            <span className="font-semibold">Voz</span>
            <select
              value={selected.voiceURI}
              onChange={(event) => {
                update({ voiceURI: event.target.value });
                const next = voices.find((voice) => voice.voiceURI === event.target.value);
                if (next) speak("Hello! Let's practice English.", { ...settings, voiceURI: next.voiceURI }, voices);
              }}
              className="h-10 rounded-xl border-2 border-border bg-surface px-3 hover:border-sky focus-visible:border-sky focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky/30"
            >
              {voices.map((voice, index) => (
                <option key={voice.voiceURI} value={voice.voiceURI}>
                  {voice.name} ({voice.lang}){index === 0 ? " · recomendada" : ""}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="flex justify-between font-semibold">
              Velocidade <span className="tabular-nums text-muted">{settings.rate.toFixed(2)}×</span>
            </span>
            <input
              type="range"
              min={0.5}
              max={1.3}
              step={0.05}
              value={settings.rate}
              onChange={(event) => update({ rate: Number(event.target.value) })}
              className="accent-primary"
            />
          </label>
        </div>
      </details>
    </div>
  );
}
