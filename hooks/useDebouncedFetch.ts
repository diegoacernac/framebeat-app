"use client";

import { useEffect, useState } from "react";

type Result<T> = { url: string; data: T | null; error: boolean };

// Pide `url` después de `delay` ms sin cambios. Si la url cambia antes de que
// llegue la respuesta, la petición anterior se cancela (AbortController), así
// una respuesta vieja nunca pisa a la nueva. `url = null` no pide nada.
export function useDebouncedFetch<T>(url: string | null, delay = 300) {
  // Guardamos a qué url pertenece la respuesta: si no coincide con la actual,
  // todavía estamos esperando. Así no hace falta resetear estado en el efecto.
  const [result, setResult] = useState<Result<T> | null>(null);

  useEffect(() => {
    if (!url) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: T = await res.json();
        setResult({ url, data, error: false });
      } catch {
        if (controller.signal.aborted) return;
        setResult({ url, data: null, error: true });
      }
    }, delay);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [url, delay]);

  const current = url && result?.url === url ? result : null;
  return {
    data: current?.data ?? null,
    loading: url !== null && current === null,
    error: current?.error ?? false,
  };
}
