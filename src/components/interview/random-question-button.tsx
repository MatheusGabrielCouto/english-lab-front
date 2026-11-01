"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { pickRandom } from "@/lib/interview-format";

/** Sorteia uma das perguntas (as da lista que está na tela) e abre. */
export function RandomQuestionButton({ slugs }: { slugs: string[] }) {
  const router = useRouter();
  if (slugs.length === 0) return null;
  return (
    <Button variant="ghost" onClick={() => router.push(`/entrevista/${pickRandom(slugs, 1)[0]}`)}>
      🎲 Sortear uma pergunta
    </Button>
  );
}
