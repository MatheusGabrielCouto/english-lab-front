"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * Lê um valor que só existe no navegador (fuso, APIs do browser) sem causar
 * diferença de hidratação: o servidor usa `serverValue`, o navegador usa `get()`.
 * `get` precisa devolver um valor estável (string, número, booleano).
 */
export function useClientValue<T extends string | number | boolean | undefined>(
  get: () => T,
  serverValue: T,
): T {
  return useSyncExternalStore(subscribe, get, () => serverValue);
}
