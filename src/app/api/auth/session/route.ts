import { NextResponse, type NextRequest } from "next/server";
import { API_URL } from "@/lib/api";
import {
  ACCESS_COOKIE,
  LOGIN_PATH,
  REFRESH_COOKIE,
  safeNextPath,
} from "@/lib/auth-paths";

/**
 * Renova a sessão para navegações de página: o proxy manda para cá quando o
 * access token expirou. O cookie de refresh tem `Path=/api/auth`, então só
 * chega em rotas como esta (e nunca em páginas ou no JavaScript do navegador).
 *
 * Esta rota tem prioridade sobre o rewrite `/api/*` → NestJS.
 */
export async function GET(request: NextRequest) {
  const next = safeNextPath(request.nextUrl.searchParams.get("next"));
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;

  const failed = () =>
    new URL(`${LOGIN_PATH}?next=${encodeURIComponent(next)}`, request.url);

  // Sessão que o backend recusou mesmo com token "fresco" (ex.: usuário
  // removido): limpa os cookies para o proxy não devolver do login ao painel.
  if (request.nextUrl.searchParams.has("reset")) {
    const response = NextResponse.redirect(failed());
    response.cookies.set(ACCESS_COOKIE, "", { path: "/", maxAge: 0 });
    response.cookies.set(REFRESH_COOKIE, "", { path: "/api/auth", maxAge: 0 });
    return response;
  }

  if (!refreshToken) return NextResponse.redirect(failed());

  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/auth/refresh`, {
      method: "POST",
      headers: {
        cookie: `${REFRESH_COOKIE}=${refreshToken}`,
        "user-agent": request.headers.get("user-agent") ?? "",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    return NextResponse.redirect(failed());
  }

  // Outra aba/requisição renovou o mesmo token no mesmo instante: o navegador
  // já deve ter os cookies novos, então tentamos uma única vez de novo.
  if (res.status === 401 && !request.nextUrl.searchParams.has("retry")) {
    const body = (await res.json().catch(() => null)) as { code?: string } | null;
    if (body?.code === "REFRESH_RACE") {
      const retry = new URL(request.url);
      retry.searchParams.set("retry", "1");
      return NextResponse.redirect(retry);
    }
  }

  const response = NextResponse.redirect(
    res.ok ? new URL(next, request.url) : failed(),
  );
  // repassa os cookies novos (ou os que limpam a sessão, se o refresh falhou)
  for (const cookie of res.headers.getSetCookie()) {
    response.headers.append("set-cookie", cookie);
  }
  return response;
}
