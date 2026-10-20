"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ApiError } from "@/lib/api-client";
import { AUDIO_ACCEPT, formatDuration, MAX_AUDIO_BYTES, MAX_RECORDING_SECONDS, megabytes, pickAudioMime } from "@/lib/motivation-format";
import type { MotivationItem } from "@/lib/motivation-types";
import { uploadMedia } from "@/lib/motivation-upload";

const FIELD =
  "w-full rounded-2xl border-2 border-border bg-surface px-4 py-3 text-base font-normal hover:border-sky focus-visible:border-sky focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky/30";

type Phase = "idle" | "recording" | "paused" | "ready";
type Clip = { blob: Blob; type: string; name: string; url: string; duration: number | null };

const EXTENSION_BY_TYPE: Record<string, string> = { "audio/webm": "webm", "audio/mp4": "m4a", "audio/ogg": "ogg", "audio/mpeg": "mp3", "audio/wav": "wav", "audio/aac": "aac" };
const TYPE_BY_EXTENSION: Record<string, string> = { webm: "audio/webm", m4a: "audio/mp4", mp4: "audio/mp4", ogg: "audio/ogg", mp3: "audio/mpeg", wav: "audio/wav", aac: "audio/aac" };

/** Só o cliente sabe se há microfone: no servidor o valor é `null` (ainda não se sabe). */
function useCanRecord() {
  return useSyncExternalStore(
    () => () => undefined,
    () => typeof MediaRecorder !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia),
    () => null,
  );
}

function micMessage(reason: unknown) {
  const name = reason instanceof DOMException ? reason.name : "";
  if (name === "NotAllowedError" || name === "SecurityError") return "O navegador bloqueou o microfone. Libere o acesso no cadeado ao lado do endereço e tente de novo.";
  if (name === "NotFoundError") return "Não encontrei um microfone neste aparelho.";
  return "Não consegui usar o microfone agora. Você pode enviar um arquivo de áudio.";
}

/** Grava a própria voz (ou envia um arquivo), escuta antes de salvar e guarda no mural. */
export function AudioRecorder({ onAdded }: { onAdded: (item: MotivationItem) => void }) {
  const canRecord = useCanRecord();
  const [phase, setPhase] = useState<Phase>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [clip, setClip] = useState<Clip | null>(null);
  const [title, setTitle] = useState("");
  const [percent, setPercent] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const accumulated = useRef(0);
  const segmentStart = useRef(0);
  const input = useRef<HTMLInputElement>(null);

  const release = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
  }, []);

  // sai da tela no meio da gravação: solta o microfone
  useEffect(() => {
    return () => {
      release();
      if (recorder.current && recorder.current.state !== "inactive") recorder.current.stop();
    };
  }, [release]);

  // solta o endereço temporário do áudio quando ele muda ou sai da tela
  useEffect(() => {
    const url = clip?.url;
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [clip]);

  const currentSeconds = () => accumulated.current + (segmentStart.current ? (Date.now() - segmentStart.current) / 1000 : 0);

  const stop = useCallback(() => {
    if (recorder.current && recorder.current.state !== "inactive") recorder.current.stop();
  }, []);

  async function start() {
    setError(null);
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (reason) {
      setError(micMessage(reason));
      return;
    }
    const mime = pickAudioMime((type) => MediaRecorder.isTypeSupported(type));
    const media = new MediaRecorder(stream.current, mime ? { mimeType: mime } : undefined);
    chunks.current = [];
    accumulated.current = 0;
    segmentStart.current = Date.now();
    setElapsed(0);

    media.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.current.push(event.data);
    };
    media.onstop = () => {
      accumulated.current = currentSeconds();
      segmentStart.current = 0;
      const duration = Math.max(1, Math.round(accumulated.current));
      const type = media.mimeType || mime || "audio/webm";
      const blob = new Blob(chunks.current, { type });
      release();
      if (blob.size === 0) {
        setPhase("idle");
        setError("A gravação saiu vazia. Fale um pouco e tente de novo.");
        return;
      }
      const base = type.split(";")[0];
      setClip({ blob, type, name: `gravacao.${EXTENSION_BY_TYPE[base] ?? "webm"}`, url: URL.createObjectURL(blob), duration });
      setElapsed(duration);
      setPhase("ready");
    };

    recorder.current = media;
    media.start(250);
    setPhase("recording");
    timer.current = setInterval(() => {
      const seconds = currentSeconds();
      setElapsed(Math.floor(seconds));
      if (seconds >= MAX_RECORDING_SECONDS) stop();
    }, 250);
  }

  function togglePause() {
    const media = recorder.current;
    if (!media) return;
    if (media.state === "recording") {
      accumulated.current = currentSeconds();
      segmentStart.current = 0;
      media.pause();
      setPhase("paused");
    } else if (media.state === "paused") {
      segmentStart.current = Date.now();
      media.resume();
      setPhase("recording");
    }
  }

  function discard() {
    setClip(null);
    setPhase("idle");
    setElapsed(0);
    setError(null);
    if (input.current) input.current.value = "";
  }

  function chooseFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    const type = file.type.startsWith("audio/") ? file.type : (TYPE_BY_EXTENSION[extension] ?? "");
    if (!type) return setError("Escolha um arquivo de áudio (WebM, M4A, OGG, MP3, WAV ou AAC).");
    if (file.size > MAX_AUDIO_BYTES) return setError(`Esse áudio tem ${megabytes(file.size)}. O limite é ${megabytes(MAX_AUDIO_BYTES)}.`);

    const url = URL.createObjectURL(file);
    setClip({ blob: file, type, name: file.name || "audio", url, duration: null });
    setPhase("ready");
    // a duração só aparece depois que o navegador lê o arquivo
    const probe = new Audio(url);
    probe.preload = "metadata";
    probe.onloadedmetadata = () => {
      if (Number.isFinite(probe.duration) && probe.duration > 0) {
        const duration = Math.round(probe.duration);
        setClip((current) => (current?.url === url ? { ...current, duration } : current));
      }
    };
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!clip || percent !== null) return;
    setError(null);
    setPercent(0);
    try {
      const item = await uploadMedia({ blob: clip.blob, contentType: clip.type, filename: clip.name, title: title.trim(), durationSec: clip.duration ?? undefined, onProgress: setPercent });
      onAdded(item);
      setTitle("");
      discard();
    } catch (reason) {
      setError(reason instanceof ApiError || reason instanceof Error ? reason.message : "Não deu para enviar agora. Tente de novo.");
    } finally {
      setPercent(null);
    }
  }

  const recording = phase === "recording" || phase === "paused";

  return (
    <form onSubmit={save} className="flex flex-col gap-4">
      {phase !== "ready" && (
        <div className="flex flex-col gap-4">
          {canRecord === false ? (
            <p className="rounded-2xl bg-butter-soft px-4 py-3 text-pretty" role="note">
              Este navegador não deixa gravar pelo microfone (ou a página não está em HTTPS). Você ainda pode enviar um arquivo de áudio abaixo.
            </p>
          ) : (
            <div className="flex flex-wrap items-center gap-4 rounded-2xl border-2 border-border bg-surface p-4">
              <p className="min-w-20 font-display text-4xl font-semibold tabular-nums" role="timer" aria-label="Tempo gravado">
                {formatDuration(elapsed)}
              </p>
              {recording ? (
                <>
                  <span className="flex items-center gap-2 font-bold text-coral-edge" role="status">
                    <span aria-hidden className={phase === "recording" ? "size-3 animate-pulse rounded-full bg-coral" : "size-3 rounded-full bg-muted"} />
                    {phase === "recording" ? "Gravando…" : "Em pausa"}
                  </span>
                  <Button type="button" variant="ghost" onClick={togglePause}>
                    {phase === "recording" ? "Pausar" : "Continuar"}
                  </Button>
                  <Button type="button" variant="coral" onClick={stop}>
                    Parar
                  </Button>
                </>
              ) : (
                <Button type="button" onClick={() => void start()} disabled={canRecord === null}>
                  🎙️ Gravar
                </Button>
              )}
              <p className="basis-full text-sm text-muted">Até {formatDuration(MAX_RECORDING_SECONDS)}. Fale com as suas palavras: o que você quer lembrar quando bater o desânimo?</p>
            </div>
          )}

          {!recording && (
            <label className="flex flex-col gap-2 font-bold">
              Ou envie um arquivo de áudio
              <input
                ref={input}
                type="file"
                accept={AUDIO_ACCEPT}
                onChange={(event) => chooseFile(event.target.files?.[0])}
                className="rounded-2xl border-2 border-dashed border-border bg-surface px-4 py-3 font-normal file:mr-4 file:rounded-pill file:border-0 file:bg-sky file:px-4 file:py-2 file:font-bold file:text-ink"
              />
              <span className="text-sm font-normal text-muted">Até {megabytes(MAX_AUDIO_BYTES)}.</span>
            </label>
          )}
        </div>
      )}

      {clip && (
        <div className="flex flex-col gap-4">
          <audio controls src={clip.url} className="w-full" aria-label="Ouvir antes de salvar" />
          <p className="text-sm text-muted">
            {clip.duration ? `${formatDuration(clip.duration)} · ` : ""}
            {megabytes(clip.blob.size)}
          </p>
          <label className="flex flex-col gap-2 font-bold">
            Título (opcional)
            <input value={title} maxLength={120} onChange={(event) => setTitle(event.target.value)} placeholder="Para os dias difíceis" className={FIELD} />
          </label>
          {percent !== null && <Progress value={percent} label="Progresso do envio" />}
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={percent !== null}>
              {percent !== null ? "Enviando…" : "Salvar áudio"}
            </Button>
            <Button type="button" variant="ghost" onClick={discard} disabled={percent !== null}>
              Descartar
            </Button>
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="font-semibold text-coral-edge">
          {error}
        </p>
      )}
    </form>
  );
}
