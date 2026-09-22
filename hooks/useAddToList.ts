"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getPosterUrl } from "@/lib/tmdb";

export type AddableMedia = {
  id: number;
  type: "movie" | "tv";
  title: string;
  year: string | null;
  posterPath: string | null;
  overview: string;
};

type Feedback = { type: "ok" | "error"; text: string };

export const mediaKey = (type: string, id: number | string) => `${type}:${id}`;

// Añadir títulos a una lista, varios seguidos: cada uno tiene su propio
// estado (añadiendo / añadida) y no bloquea a los demás. `existingKeys` son
// los que ya están en la lista ("movie:123"), vienen del servidor.
export function useAddToList(listId: string, existingKeys: string[]) {
  const router = useRouter();
  const [adding, setAdding] = useState<Set<string>>(new Set());
  // Añadidas aquí: se marcan ✓ al instante, sin esperar al router.refresh()
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [, startTransition] = useTransition();

  const existing = new Set(existingKeys);
  const isInList = (type: string, id: number) =>
    existing.has(mediaKey(type, id)) || added.has(mediaKey(type, id));
  const isAdding = (type: string, id: number) => adding.has(mediaKey(type, id));

  // El mensaje se va solo a los 3 segundos
  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 3000);
    return () => clearTimeout(timer);
  }, [feedback]);

  function update(set: typeof setAdding, key: string, on: boolean) {
    set((prev) => {
      const next = new Set(prev);
      if (on) next.add(key);
      else next.delete(key);
      return next;
    });
  }

  async function add(media: AddableMedia) {
    const key = mediaKey(media.type, media.id);
    if (adding.has(key) || isInList(media.type, media.id)) return;
    update(setAdding, key, true);

    const res = await fetch(`/api/lists/${listId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mediaType: media.type,
        externalId: String(media.id),
        title: media.title,
        posterUrl: getPosterUrl(media.posterPath, "w185"),
        metadata: { overview: media.overview, year: media.year },
      }),
    });

    update(setAdding, key, false);
    if (!res.ok && res.status !== 409) {
      const body = await res.json().catch(() => ({}));
      setFeedback({ type: "error", text: body.error ?? "No se pudo añadir" });
      return;
    }

    // 409 = ya estaba (la añadió la otra persona): igual cuenta como añadida
    update(setAdded, key, true);
    setFeedback({ type: "ok", text: `"${media.title}" añadida a la lista` });
    startTransition(() => router.refresh());
  }

  return { add, isInList, isAdding, feedback };
}
