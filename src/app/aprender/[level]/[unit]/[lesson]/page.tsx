import type { Metadata } from "next";
import { Suspense } from "react";
import { LessonPlayer } from "@/components/trail/lesson-player";
import { serverApi } from "@/lib/api-server";
import type { LessonData } from "@/lib/trail-types";

export const metadata: Metadata = { title: "Lição" };

type Props = PageProps<"/aprender/[level]/[unit]/[lesson]">;

export default function LessonPage({ params }: Props) {
  return (
    <Suspense fallback={<p className="p-8 text-center font-semibold text-muted">Preparando a lição…</p>}>
      <Lesson params={params} />
    </Suspense>
  );
}

async function Lesson({ params }: { params: Props["params"] }) {
  const { level, unit, lesson } = await params;
  const { lesson: data } = await serverApi<{ lesson: LessonData }>(
    `/api/trail/${level}/${unit}/${lesson}`,
    `/aprender/${level}/${unit}/${lesson}`,
  );
  return <LessonPlayer lesson={data} />;
}
