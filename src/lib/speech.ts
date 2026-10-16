"use client";

import { useSyncExternalStore } from "react";

/* ------------------------------------------------------------------ *
 * Escolha da melhor voz em inglês disponível no dispositivo.
 * A voz padrão do navegador costuma ser a pior; aqui ranqueamos todas.
 * ------------------------------------------------------------------ */

/** Vozes antigas, robóticas ou de brinquedo (macOS) que nunca queremos. */
const BAD_VOICES =
  /\b(albert|bad news|bahh|bells|boing|bubbles|bolhas|cellos|deranged|good news|hysterical|jester|organ|superstar|trinoids|whisper|wobble|zarvox|fred|junior|ralph|kathy|agnes|bruce|vicki|princess|eddy|flo|grandma|grandpa|reed|rocko|sandy|shelley|espeak)\b/i;

function scoreVoice(voice: SpeechSynthesisVoice): number {
  const name = voice.name;
  let score = 0;

  // sotaque: americano primeiro, depois britânico, depois o resto do inglês
  if (voice.lang === "en-US") score += 30;
  else if (voice.lang === "en-GB") score += 20;
  else score += 10;

  // vozes neurais / de alta qualidade
  if (/natural|neural|online/i.test(name)) score += 100; // Microsoft Edge
  if (/premium|enhanced|siri/i.test(name)) score += 80; // Apple
  if (/google/i.test(name)) score += 60; // Chrome/Android
  if (/\b(samantha|ava|allison|zoe|evan|nathan|tom|daniel|serena|karen|moira|tessa|oliver|jamie|aaron|nicky)\b/i.test(name)) {
    score += 40;
  }
  // vozes remotas costumam ser melhores que as locais "compactas"
  if (!voice.localService) score += 15;
  if (/compact/i.test(name)) score -= 30;

  return score;
}

/** Vozes em inglês, da melhor para a pior. */
function rankEnglishVoices(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return [];
  return window.speechSynthesis
    .getVoices()
    .filter((voice) => voice.lang.toLowerCase().startsWith("en") && !BAD_VOICES.test(voice.name))
    .sort((a, b) => scoreVoice(b) - scoreVoice(a));
}

/* As vozes carregam de forma assíncrona; o cache mantém a referência estável. */
let voicesCache: SpeechSynthesisVoice[] = [];
let listening = false;

function subscribeVoices(notify: () => void) {
  if (!("speechSynthesis" in window)) return () => {};
  const refresh = () => {
    voicesCache = rankEnglishVoices();
    notify();
  };
  if (!listening) {
    voicesCache = rankEnglishVoices();
    listening = true;
  }
  window.speechSynthesis.addEventListener("voiceschanged", refresh);
  return () => window.speechSynthesis.removeEventListener("voiceschanged", refresh);
}

const EMPTY: SpeechSynthesisVoice[] = [];

export function useEnglishVoices(): SpeechSynthesisVoice[] {
  return useSyncExternalStore(subscribeVoices, () => voicesCache, () => EMPTY);
}

/* ------------------------------------------------------------------ *
 * Preferências (voz e velocidade) guardadas no navegador.
 * ------------------------------------------------------------------ */

const STORAGE_KEY = "english-lab:speech";
const CHANGE_EVENT = "english-lab:speech-change";

export type SpeechSettings = { voiceURI: string | null; rate: number };
const DEFAULTS: SpeechSettings = { voiceURI: null, rate: 0.9 };

function readRaw(): string {
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

function parse(raw: string): SpeechSettings {
  try {
    const data = JSON.parse(raw) as Partial<SpeechSettings>;
    const rate = typeof data.rate === "number" ? Math.min(1.3, Math.max(0.5, data.rate)) : DEFAULTS.rate;
    return { voiceURI: typeof data.voiceURI === "string" ? data.voiceURI : null, rate };
  } catch {
    return DEFAULTS;
  }
}

function subscribeSettings(notify: () => void) {
  window.addEventListener("storage", notify);
  window.addEventListener(CHANGE_EVENT, notify);
  return () => {
    window.removeEventListener("storage", notify);
    window.removeEventListener(CHANGE_EVENT, notify);
  };
}

/** Devolve a string crua (estável) e converte fora do snapshot. */
export function useSpeechSettings(): [SpeechSettings, (patch: Partial<SpeechSettings>) => void] {
  const raw = useSyncExternalStore(subscribeSettings, readRaw, () => "");
  const settings = raw ? parse(raw) : DEFAULTS;

  function update(patch: Partial<SpeechSettings>) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...settings, ...patch }));
    } catch {
      // modo privado / armazenamento bloqueado: só não persiste
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }

  return [settings, update];
}

/* ------------------------------------------------------------------ *
 * Fala
 * ------------------------------------------------------------------ */

export function speak(text: string, settings: SpeechSettings, voices: SpeechSynthesisVoice[]) {
  if (!text.trim() || !("speechSynthesis" in window)) return;

  const voice =
    voices.find((candidate) => candidate.voiceURI === settings.voiceURI) ?? voices[0];

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang;
  } else {
    utterance.lang = "en-US";
  }
  utterance.rate = settings.rate;
  window.speechSynthesis.speak(utterance);
}
