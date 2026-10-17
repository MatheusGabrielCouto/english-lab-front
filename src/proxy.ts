import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_COOKIE, HOME_AFTER_LOGIN, LOGIN_PATH } from "@/lib/auth-paths";

/** Lê o `exp` do JWT sem validar a assinatura (quem valida é o backend). */
function accessTokenIsFresh(token: string | undefined) {
  if (!token) return false;
  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const { exp } = JSON.parse(json) as { exp?: number };
    return typeof exp === "number" && exp * 1000 > Date.now() + 5_000;
  } catch {
    return false;
  }
}

const AUTH_PAGES = [LOGIN_PATH, "/cadastrar"];

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const fresh = accessTokenIsFresh(request.cookies.get(ACCESS_COOKIE)?.value);

  if (AUTH_PAGES.includes(pathname)) {
    // já logado: não faz sentido ver login/cadastro
    return fresh
      ? NextResponse.redirect(new URL(HOME_AFTER_LOGIN, request.url))
      : NextResponse.next();
  }

  // rota protegida
  if (fresh) return NextResponse.next();

  // O refresh token só é enviado para /api/auth/* (não chega aqui). Quem tenta
  // renovar é /api/auth/session, que volta para esta página com cookies novos
  // ou manda para o login se não houver sessão.
  const url = new URL("/api/auth/session", request.url);
  url.searchParams.set("next", pathname + search);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/painel/:path*", "/trilha/:path*", "/aprender/:path*", "/anki/:path*", "/biblioteca/:path*", "/admin/:path*", "/entrar", "/cadastrar"],
};
