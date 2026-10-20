import { api } from "@/lib/api-client";
import { postToBucket } from "@/lib/bucket-upload";
import type { CreatedUpload, MotivationItem } from "@/lib/motivation-types";

/** O caminho completo de uma imagem ou áudio: registra, envia direto ao bucket e confirma. */
export async function uploadMedia(input: {
  blob: Blob;
  contentType: string;
  filename: string;
  title?: string;
  text?: string;
  durationSec?: number;
  onProgress?: (percent: number) => void;
}): Promise<MotivationItem> {
  const created = await api<CreatedUpload>("/motivation/uploads", {
    method: "POST",
    body: {
      contentType: input.contentType,
      sizeBytes: input.blob.size,
      title: input.title || undefined,
      text: input.text || undefined,
      durationSec: input.durationSec,
    },
  });
  // o bucket exige o mesmo tipo que foi registrado (sem os parâmetros de codec)
  await postToBucket(created.upload, input.blob, created.upload.fields["Content-Type"] ?? input.contentType, input.filename, input.onProgress);
  const { item } = await api<{ item: MotivationItem }>(`/motivation/${created.item.id}/confirm`, { method: "POST" });
  return item;
}
