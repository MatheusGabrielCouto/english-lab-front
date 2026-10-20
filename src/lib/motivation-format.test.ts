import { describe, expect, it } from "vitest";
import { countsByFilter, embedUrl, fitWithin, formatDuration, matchesFilter, megabytes, parseYoutubeId, pickAnother, pickAudioMime, thumbnailUrl } from "./motivation-format";
import type { MotivationItem } from "./motivation-types";

const item = (overrides: Partial<MotivationItem>): MotivationItem => ({
  id: "1", type: "QUOTE", title: null, text: "Keep going", author: null, videoId: null, mediaType: null, durationSec: null, favorite: false, createdAt: "2026-10-20T10:00:00Z", mediaUrl: null, ...overrides,
});

describe("parseYoutubeId", () => {
  const id = "dQw4w9WgXcQ";
  it("entende os formatos de link do YouTube", () => {
    for (const url of [`https://www.youtube.com/watch?v=${id}&t=3`, `https://youtu.be/${id}?si=x`, `https://www.youtube.com/shorts/${id}`, `https://www.youtube.com/embed/${id}`, `youtube.com/watch?v=${id}`, `  https://m.youtube.com/watch?v=${id} `]) {
      expect(parseYoutubeId(url)).toBe(id);
    }
  });

  it("recusa o que não é link do YouTube", () => {
    for (const url of ["", "oi", "https://vimeo.com/123456789", "https://youtube.com.evil.com/watch?v=dQw4w9WgXcQ", "javascript:alert(1)", "https://www.youtube.com/watch?v=curto", "https://www.youtube.com/"]) {
      expect(parseYoutubeId(url)).toBeNull();
    }
  });
});

describe("links do YouTube", () => {
  it("miniatura e player sem cookies de rastreamento", () => {
    expect(thumbnailUrl("abc12345678")).toBe("https://i.ytimg.com/vi/abc12345678/hqdefault.jpg");
    expect(embedUrl("abc12345678")).toContain("youtube-nocookie.com/embed/abc12345678");
  });
});

describe("formatDuration", () => {
  it("minutos e segundos", () => {
    expect(formatDuration(5)).toBe("0:05");
    expect(formatDuration(65)).toBe("1:05");
    expect(formatDuration(300)).toBe("5:00");
    expect(formatDuration(-3)).toBe("0:00");
  });
});

describe("pickAudioMime", () => {
  it("escolhe o primeiro formato suportado, na ordem de preferência", () => {
    expect(pickAudioMime(() => true)).toBe("audio/webm;codecs=opus");
    expect(pickAudioMime((type) => type === "audio/mp4")).toBe("audio/mp4");
    expect(pickAudioMime((type) => type.startsWith("audio/webm") && !type.includes("codecs"))).toBe("audio/webm");
    expect(pickAudioMime(() => false)).toBeNull();
  });
});

describe("fitWithin", () => {
  it("só reduz quando o lado maior passa do limite, mantendo a proporção", () => {
    expect(fitWithin(800, 600)).toEqual({ width: 800, height: 600, resized: false });
    expect(fitWithin(3200, 1600)).toEqual({ width: 1600, height: 800, resized: true });
    expect(fitWithin(1200, 4800)).toEqual({ width: 400, height: 1600, resized: true });
  });
});

describe("filtros e sorteio", () => {
  const items = [item({ id: "a", type: "QUOTE", favorite: true }), item({ id: "b", type: "IMAGE" }), item({ id: "c", type: "AUDIO" }), item({ id: "d", type: "AUDIO", favorite: true })];

  it("filtra por tipo e por favoritos e conta cada filtro", () => {
    expect(items.filter((entry) => matchesFilter(entry, "AUDIO")).map((entry) => entry.id)).toEqual(["c", "d"]);
    expect(items.filter((entry) => matchesFilter(entry, "FAVORITES")).map((entry) => entry.id)).toEqual(["a", "d"]);
    expect(countsByFilter(items)).toEqual({ ALL: 4, QUOTE: 1, IMAGE: 1, VIDEO: 0, AUDIO: 2, FAVORITES: 2 });
  });

  it("pickAnother evita o item atual quando há mais de um", () => {
    for (const roll of [0, 0.3, 0.6, 0.99]) {
      expect(pickAnother(items, "b", () => roll)?.id).not.toBe("b");
    }
  });

  it("com um item só, mostra ele; sem itens, nada", () => {
    expect(pickAnother([items[0]], "a")?.id).toBe("a");
    expect(pickAnother([], null)).toBeNull();
  });
});

describe("megabytes", () => {
  it("KB abaixo de 1 MB, MB com vírgula acima", () => {
    expect(megabytes(500)).toBe("1 KB");
    expect(megabytes(204800)).toBe("200 KB");
    expect(megabytes(2.5 * 1024 * 1024)).toBe("2,5 MB");
  });
});
