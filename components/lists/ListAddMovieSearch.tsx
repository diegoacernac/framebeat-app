"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDebouncedFetch } from "@/hooks/useDebouncedFetch";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { getPosterUrl } from "../../lib/tmdb";

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

export function ListAddMovieSearch({ listId, kind = "movie" }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [addingId, setAddingId] = useState<number | null>(null);

  const searchUrl = kind === "tv" ? "/api/series/search" : "/api/movies/search";
  const trimmed = query.trim();
  const { data, loading, error } = useDebouncedFetch<{ results?: MovieResult[] }>(
    trimmed ? `${searchUrl}?q=${encodeURIComponent(trimmed)}` : null
  );
  const results = data?.results ?? [];

  async function addMovie(movie: MovieResult) {
    setAddingId(movie.id);
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
    setAddingId(null);

    if (res.ok) {
      setQuery("");
      router.refresh();
    }
  }

  return (
    <div className="space-y-3">
      <Input
        placeholder={kind === "tv" ? "Buscar serie para añadir..." : "Buscar película para añadir..."}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {loading && <p className="text-xs text-muted-foreground">Buscando...</p>}
      {!loading && error && (
        <p className="text-xs text-destructive">No se pudo buscar. Intenta de nuevo.</p>
      )}
      <ul className="space-y-2">
        {results.map((movie) => (
          <li
            key={movie.id}
            className="flex items-center justify-between gap-2 border p-2 text-sm"
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
              disabled={addingId === movie.id}
              onClick={() => addMovie(movie)}
            >
              {addingId === movie.id ? "..." : "Añadir"}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}