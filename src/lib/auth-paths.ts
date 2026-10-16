export const ACCESS_COOKIE = "access_token";
export const REFRESH_COOKIE = "refresh_token";

export const LOGIN_PATH = "/entrar";
export const HOME_AFTER_LOGIN = "/painel";

/**
 * Aceita só caminhos internos (`/algo`). Bloqueia `//evil.com`, `/\evil.com`
 * e URLs absolutas, para o parâmetro `next` não virar open redirect.
 */
export function safeNextPath(next: string | null | undefined) {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) {
    return HOME_AFTER_LOGIN;
  }
  return next;
}
