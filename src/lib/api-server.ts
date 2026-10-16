import "server-only";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { API_URL } from "@/lib/api";
import { ACCESS_COOKIE } from "@/lib/auth-paths";

/**
 * GET autenticado ao NestJS a partir de um Server Component.
 * Sem sessão válida, passa pela rota que tenta renovar e volta para `nextPath`.
 * Depende da requisição: use dentro de <Suspense>.
 */
export async function serverApi<T>(path: string, nextPath: string): Promise<T> {
  const renew = () =>
    redirect(`/api/auth/session?next=${encodeURIComponent(nextPath)}`);

  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) renew();

  const res = await fetch(`${API_URL}${path}`, {
    headers: { cookie: `${ACCESS_COOKIE}=${token}` },
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });

  if (res.status === 401) renew();
  // 400 = id malformado na URL
  if (res.status === 404 || res.status === 400) notFound();
  if (!res.ok) throw new Error(`API ${res.status} em ${path}`);
  return (await res.json()) as T;
}
