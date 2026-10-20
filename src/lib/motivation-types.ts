export type MotivationType = "QUOTE" | "IMAGE" | "VIDEO" | "AUDIO";

export type MotivationItem = {
  id: string;
  type: MotivationType;
  title: string | null;
  /** a frase, ou a legenda de uma imagem */
  text: string | null;
  author: string | null;
  /** id do vídeo do YouTube */
  videoId: string | null;
  mediaType: string | null;
  durationSec: number | null;
  favorite: boolean;
  createdAt: string;
  /** link temporário (imagem ou áudio) */
  mediaUrl: string | null;
};

export type MotivationBoardData = {
  mediaEnabled: boolean;
  items: MotivationItem[];
};

export type CreatedUpload = {
  item: { id: string; type: "IMAGE" | "AUDIO" };
  upload: { url: string; fields: Record<string, string> };
};
