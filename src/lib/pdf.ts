"use client";

import type * as PdfJs from "pdfjs-dist";

let loading: Promise<typeof PdfJs> | undefined;

/** Recursos do pdf.js servidos por nós (copiados para public/pdfjs no postinstall). */
export const PDF_ASSETS = {
  cMapUrl: "/pdfjs/cmaps/",
  cMapPacked: true,
  standardFontDataUrl: "/pdfjs/standard_fonts/",
  iccUrl: "/pdfjs/iccs/",
  wasmUrl: "/pdfjs/wasm/",
} as const;

/** Carrega o pdf.js só quando alguém abre um livro (é grande) e liga o worker. */
export function loadPdfJs(): Promise<typeof PdfJs> {
  loading ??= import("pdfjs-dist").then((pdfjs) => {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url,
    ).toString();
    return pdfjs;
  });
  return loading;
}

/** Lê um PDF local: número de páginas e uma capa em JPEG da primeira página. */
export async function readPdfInfo(file: File, coverWidth = 420) {
  const pdfjs = await loadPdfJs();
  const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()), ...PDF_ASSETS });
  try {
    const doc = await task.promise;
    const page = await doc.getPage(1);
    const base = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: coverWidth / base.width });

    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    await page.render({ canvas, viewport }).promise;

    const cover = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.82));
    return { pageCount: doc.numPages, cover };
  } finally {
    await task.destroy();
  }
}
