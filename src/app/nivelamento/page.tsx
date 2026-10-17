import type { Metadata } from "next";
import { Suspense } from "react";
import { PlacementTest } from "@/components/trail/placement-test";
import { serverApi } from "@/lib/api-server";
import type { PlacementData } from "@/lib/trail-types";

export const metadata: Metadata = { title: "Teste de nível" };

export default function PlacementPage() {
  return (
    <Suspense fallback={<p className="p-8 text-center font-semibold text-muted">Preparando o teste…</p>}>
      <Test />
    </Suspense>
  );
}

async function Test() {
  const data = await serverApi<PlacementData>("/api/placement", "/nivelamento");
  return <PlacementTest data={data} />;
}
