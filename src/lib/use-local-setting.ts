"use client";

import { useSyncExternalStore } from "react";

const EVENT = "english-lab:setting";

function read(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function subscribe(notify: () => void) {
  window.addEventListener("storage", notify);
  window.addEventListener(EVENT, notify);
  return () => {
    window.removeEventListener("storage", notify);
    window.removeEventListener(EVENT, notify);
  };
}

/**
 * Preferência guardada no navegador (tema do leitor, zoom…). Antes de hidratar (e se o
 * armazenamento estiver bloqueado) vale o `fallback`, sem diferença de hidratação.
 */
export function useLocalSetting<T extends string>(
  key: string,
  fallback: T,
  allowed?: readonly T[],
): [T, (value: T) => void] {
  const raw = useSyncExternalStore(
    subscribe,
    () => read(key),
    () => null,
  );
  const value = raw !== null && (!allowed || (allowed as readonly string[]).includes(raw)) ? (raw as T) : fallback;

  function set(next: T) {
    try {
      window.localStorage.setItem(key, next);
    } catch {
      // armazenamento bloqueado: a preferência só não persiste
    }
    window.dispatchEvent(new Event(EVENT));
  }
  return [value, set];
}
