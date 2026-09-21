"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckIcon } from "@phosphor-icons/react/dist/ssr";
import { useDebouncedFetch } from "@/hooks/useDebouncedFetch";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Spinner } from "../ui/spinner";
import { getPosterUrl } from "../../lib/tmdb";
import { cn } from "@/lib/utils";

type MovieResult = {
  id: number;
  title: string;
  release_date: string;
  poster_path: string | null;
  overview: string;
};

type Props = {
  listId: string;
  kind?: "movie" | "tv";
};

type Feedback = { type: "ok" | "error"; text: string };

export function ListAddMovieSearch({ listId, kind = "movie" }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [addingId, setAddingId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  // isPending sigue en true hasta que router.refresh() trae la lista nueva:
  // así el spinner dura justo hasta que la fila aparece, no solo hasta el POST
  const [isPending, startTransition] = useTransition();

  const searchUrl = kind === "tv" ? "/api/series/search" : "/api/movies/search";
  const trimmed = query.trim();
  const { data, loading, error } = useDebouncedFetch<{ results?: MovieResult[] }>(
    trimmed ? `${searchUrl}?q=${encodeURIComponent(trimmed)}` : null
  );
  const results = data?.results ?? [];

  // El mensaje de "añadida" se va solo a los 3 segundos
  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 3000);
    return () => clearTimeout(timer);
  }, [feedback]);

  function addMovie(movie: MovieResult) {
    setAddingId(movie.id);
    setFeedback(null);

    startTransition(async () => {
      const res = await fetch(`/api/lists/${listId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaType: kind,
          externalId: String(movie.id),
          title: movie.title,
          posterUrl: getPosterUrl(movie.poster_path, "w185"),
          metadata: { overview: movie.overview, year: movie.release_date?.slice(0, 4) },
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        // Los setState después de un await, dentro de startTransition otra vez
        // (regla de React 19 para transiciones async)
        startTransition(() => {
          setAddingId(null);
          setFeedback({ type: "error", text: body.error ?? "No se pudo añadir" });
        });
        return;
      }

      router.refresh();
      startTransition(() => {
        setQuery("");
        setAddingId(null);
        setFeedback({ type: "ok", text: `"${movie.title}" añadida a la lista` });
      });
    });
  }

  return (
    <div className="space-y-3">
      <Input
        placeholder={kind === "tv" ? "Buscar serie para añadir..." : "Buscar película para añadir..."}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {loading && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Spinner size={12} /> Buscando...
        </p>
      )}
      {!loading && error && (
        <p className="text-xs text-destructive">No se pudo buscar. Intenta de nuevo.</p>
      )}

      {feedback && (
        <p
          key={feedback.text}
          role="status"
          className={cn(
            "flex items-center gap-1.5 text-xs animate-in fade-in slide-in-from-top-1 duration-200",
            feedback.type === "ok" ? "text-amber-500" : "text-destructive"
          )}
        >
          {feedback.type === "ok" && <CheckIcon size={12} weight="bold" />}
          {feedback.text}
        </p>
      )}

      <ul className="space-y-2">
        {results.map((movie, i) => {
          const isAdding = addingId === movie.id;
          return (
            <li
              key={movie.id}
              className={cn(
                "flex items-center justify-between gap-2 border p-2 text-sm transition-opacity",
                "animate-in fade-in slide-in-from-top-1 fill-mode-both duration-200",
                // Mientras se añade una, las demás se atenúan
                addingId !== null && !isAdding && "opacity-40"
              )}
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <span>
                {movie.title}{" "}
                <span className="text-muted-foreground">
                  ({movie.release_date?.slice(0, 4)})
                </span>
              </span>
              <Button
                type="button"
                size="sm"
                disabled={isPending}
                onClick={() => addMovie(movie)}
                className="min-w-20"
              >
                {isAdding ? (
                  <>
                    <Spinner size={12} /> Añadiendo
                  </>
                ) : (
                  "Añadir"
                )}
              </Button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
