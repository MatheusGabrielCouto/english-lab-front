import type { MotivationItem, MotivationType } from "@/lib/motivation-types";

export const QUOTE_MAX = 500;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_AUDIO_BYTES = 15 * 1024 * 1024;
/** Um áudio gravado no navegador para sozinho depois disto. */
export const MAX_RECORDING_SECONDS = 5 * 60;
/** Imagens maiores que isto (em pixels) são reduzidas antes de enviar. */
export const MAX_IMAGE_SIDE = 1600;

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
export const AUDIO_ACCEPT = "audio/webm,audio/mp4,audio/x-m4a,audio/ogg,audio/mpeg,audio/wav,audio/aac,.m4a,.mp3,.wav,.ogg,.webm,.aac";

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const YOUTUBE_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com", "youtube-nocookie.com", "www.youtube-nocookie.com", "youtu.be"]);
const ID_PATHS = new Set(["embed", "shorts", "live", "v"]);

/** O id de 11 caracteres de um link do YouTube (watch, youtu.be, shorts, embed, live), ou `null`. Espelha o servidor. */
export function parseYoutubeId(input: string): string | null {
  const text = input.trim();
  if (!text || /\s/.test(text)) return null;
  let url: URL;
  try {
    url = new URL(/^[a-z][a-z0-9+.-]*:/i.test(text) ? text : `https://${text}`);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  const host = url.hostname.toLowerCase();
  if (!YOUTUBE_HOSTS.has(host)) return null;

  const parts = url.pathname.split("/").filter(Boolean);
  let id: string | undefined;
  if (host === "youtu.be") id = parts[0];
  else if (parts[0] === "watch") id = url.searchParams.get("v") ?? undefined;
  else if (ID_PATHS.has(parts[0])) id = parts[1];
  return id && VIDEO_ID.test(id) ? id : null;
}

export const thumbnailUrl = (videoId: string) => `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
/** O player só é montado quando o aluno clica; usa o domínio sem cookies de rastreamento. */
export const embedUrl = (videoId: string) => `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`;
export const watchUrl = (videoId: string) => `https://www.youtube.com/watch?v=${videoId}`;

/** "1:05" a partir de segundos. */
export function formatDuration(total: number) {
  const seconds = Math.max(0, Math.round(total));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

const RECORDING_TYPES = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"] as const;

/** O primeiro formato de gravação que o navegador suporta (Chrome/Firefox: webm/ogg; Safari: mp4). */
export function pickAudioMime(isSupported: (type: string) => boolean): string | null {
  return RECORDING_TYPES.find((type) => isSupported(type)) ?? null;
}

/** As novas medidas de uma imagem, sem passar de `max` no lado maior e sem ampliar. */
export function fitWithin(width: number, height: number, max = MAX_IMAGE_SIDE) {
  const longest = Math.max(width, height);
  if (longest <= max) return { width, height, resized: false };
  const scale = max / longest;
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)), resized: true };
}

export type Filter = "ALL" | MotivationType | "FAVORITES";

export const FILTERS: { value: Filter; label: string }[] = [
  { value: "ALL", label: "Tudo" },
  { value: "QUOTE", label: "Frases" },
  { value: "IMAGE", label: "Imagens" },
  { value: "VIDEO", label: "Vídeos" },
  { value: "AUDIO", label: "Áudios" },
  { value: "FAVORITES", label: "⭐ Favoritos" },
];

export function matchesFilter(item: MotivationItem, filter: Filter) {
  if (filter === "ALL") return true;
  if (filter === "FAVORITES") return item.favorite;
  return item.type === filter;
}

export function countsByFilter(items: MotivationItem[]): Record<Filter, number> {
  return Object.fromEntries(FILTERS.map(({ value }) => [value, items.filter((item) => matchesFilter(item, value)).length])) as Record<Filter, number>;
}

/** Outro item do mural (diferente do atual, se houver mais de um). `random` é injetável nos testes. */
export function pickAnother(items: MotivationItem[], currentId: string | null, random: () => number = Math.random): MotivationItem | null {
  if (items.length === 0) return null;
  const pool = items.length > 1 ? items.filter((item) => item.id !== currentId) : items;
  return pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))];
}

export const TYPE_LABEL: Record<MotivationType, string> = { QUOTE: "Frase", IMAGE: "Imagem", VIDEO: "Vídeo", AUDIO: "Áudio" };

export function megabytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;
}
