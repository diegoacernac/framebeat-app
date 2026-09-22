"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useDebouncedFetch } from "@/hooks/useDebouncedFetch";
import { MediaCard } from "./MediaCard";
import { MediaCardSkeleton } from "./MediaCardSkeleton";
import { getPosterUrl } from "@/lib/tmdb";

type MovieResult = {
  id: number;
  title: string;
  release_date: string;
  poster_path: string | null;
  vote_average?: number;
  overview?: string;
};

type Props = {
  initialResults?: MovieResult[];
  kind?: "movie" | "tv";
};

export function MediaSearch({ initialResults = [], kind = "movie" }: Props) {
  const searchUrl = kind === "tv" ? "/api/series/search" : "/api/movies/search";
  const hrefBase = kind === "tv" ? "/series" : "/movies";
  const [query, setQuery] = useState("");
  const trimmed = query.trim();
  const { data, loading, error } = useDebouncedFetch<{ results?: MovieResult[] }>(
    trimmed ? `${searchUrl}?q=${encodeURIComponent(trimmed)}` : null
  );
  const results = trimmed ? data?.results ?? [] : initialResults;

  const showingInitial = !trimmed && initialResults.length > 0;

  return (
    <div className="space-y-6">
      <Input
        placeholder={kind === "tv" ? "Buscar series..." : "Buscar películas..."}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {showingInitial && (
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          Populares ahora
        </p>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 lg:gap-5">
        {loading ? (
          <MediaCardSkeleton count={10} />
        ) : (
          results.map((movie, i) => (
            <MediaCard
              key={movie.id}
              index={i}
              href={`${hrefBase}/${movie.id}`}
              title={movie.title}
              subtitle={movie.release_date?.slice(0, 4)}
              posterUrl={getPosterUrl(movie.poster_path, "w342")}
              rating={movie.vote_average}
              overview={movie.overview ?? ""}
            />
          ))
        )}
      </div>

      {!loading && error && (
        <p className="text-sm text-destructive">
          No se pudo buscar. Intenta de nuevo.
        </p>
      )}

      {!loading && !error && trimmed && results.length === 0 && (
        <p className="text-sm text-muted-foreground">
          {kind === "tv" ? "No se encontraron series." : "No se encontraron películas."}
        </p>
      )}
    </div>
  );
}
