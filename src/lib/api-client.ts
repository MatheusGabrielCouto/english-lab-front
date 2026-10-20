"use client";

export type FieldError = { field: string; message: string };

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly errors: FieldError[] = [],
  ) {
    super(message);
  }
}

type Options = { method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"; body?: unknown };

let refreshing: Promise<void> | null = null;

/** Renova a sessão uma vez, mesmo que várias chamadas peçam ao mesmo tempo. */
function refreshSession(): Promise<void> {
  refreshing ??= fetch("/api/auth/refresh", { method: "POST" })
    .then(() => undefined)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

async function send(path: string, { method = "GET", body }: Options) {
  // FormData (upload) leva o Content-Type com o boundary; o navegador define sozinho
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  return fetch(`/api${path}`, {
    method,
    headers: body === undefined || isForm ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
  });
}

/** Envia um arquivo (multipart). Mesmas regras de renovação de sessão do `api`. */
export function upload<T>(path: string, form: FormData): Promise<T> {
  return api<T>(path, { method: "POST", body: form });
}

/**
 * Chama o backend pelo mesmo domínio. Se o access token (15 min) expirou no meio
 * de uma sessão de estudo, renova e repete a chamada uma vez.
 */
export async function api<T = void>(path: string, options: Options = {}): Promise<T> {
  let res = await send(path, options);

  if (res.status === 401) {
    await refreshSession();
    res = await send(path, options);
  }

  if (res.status === 401) {
    // navegação completa de propósito: descarta o estado da página e passa pelo proxy
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = `/entrar?next=${encodeURIComponent(window.location.pathname)}`;
    throw new ApiError(401, "Sua sessão expirou");
  }

  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as {
      message?: string;
      errors?: FieldError[];
    };
    throw new ApiError(
      res.status,
      data.message ?? "Algo deu errado. Tente novamente.",
      data.errors,
    );
  }

  return (res.status === 204 ? undefined : await res.json()) as T;
}
