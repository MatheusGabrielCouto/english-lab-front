import "server-only";

/**
 * URL interna do backend NestJS. Usada só no servidor do Next.
 * No navegador, as chamadas passam por `/api/*` (rewrite no next.config.ts),
 * então os cookies de sessão ficam na mesma origem.
 */
export const API_URL = process.env.API_URL ?? "http://localhost:3001";

export type HealthResponse = {
  status: "ok";
  database: "up";
  uptime: number;
};

export async function getHealth(): Promise<HealthResponse | null> {
  try {
    const res = await fetch(`${API_URL}/api/health`, {
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    return (await res.json()) as HealthResponse;
  } catch {
    return null;
  }
}
