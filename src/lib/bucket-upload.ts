import type { PresignedUpload } from "@/lib/book-types";

/** Envia o arquivo direto ao bucket (POST pré-assinado), com progresso. O arquivo vai por último. */
export function postToBucket(target: PresignedUpload, blob: Blob, type: string, filename: string, onProgress?: (percent: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const form = new FormData();
    for (const [key, value] of Object.entries(target.fields)) form.append(key, value);
    form.append("file", new Blob([blob], { type }), filename);

    const request = new XMLHttpRequest();
    request.open("POST", target.url);
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(Math.round((event.loaded / event.total) * 100));
    };
    request.onload = () =>
      request.status >= 200 && request.status < 300
        ? resolve()
        : reject(new Error(`O armazenamento recusou o arquivo (${request.status}).`));
    request.onerror = () =>
      reject(new Error("Não consegui enviar o arquivo. Confira a conexão e o CORS do bucket."));
    request.send(form);
  });
}
