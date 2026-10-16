import "server-only";
import { cookies } from "next/headers";
import { API_URL } from "@/lib/api";
import { ACCESS_COOKIE } from "@/lib/auth-paths";

export type Role = "USER" | "ADMIN";

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
};

/**
 * Lê o usuário logado no servidor (repassa o cookie de sessão ao NestJS).
 * Depende da requisição, então só use dentro de um <Suspense>.
 * Devolve `null` quando não há sessão válida.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) return null;

  try {
    const res = await fetch(`${API_URL}/api/auth/me`, {
      headers: { cookie: `${ACCESS_COOKIE}=${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { user: CurrentUser };
    return body.user;
  } catch {
    return null;
  }
}
