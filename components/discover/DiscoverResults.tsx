"use client";

import { useState } from "react";
import { MediaCard } from "@/components/media/MediaCard";
import { Button } from "@/components/ui/button";
import { getPosterUrl, type TmdbMovieSearchResult } from "@/lib/tmdb";

type Props = {
  initialMovies: TmdbMovieSearchResult[];
  startPage: number;
  totalPages: number;
  totalResults: number;
  // Filtros actuales como query string (sin page/shuffle), para pedir más páginas
  filterQuery: string;
  shuffled: boolean;
};

export function DiscoverResults({
  initialMovies,
  startPage,
  totalPages,
  totalResults,
  filterQuery,
  shuffled,
}: Props) {
  const [movies, setMovies] = useState(initialMovies);
  const [page, setPage] = useState(startPage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const hasMore = page < totalPages;

  async function loadMore() {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/discover?${filterQuery}&page=${page + 1}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: { results: TmdbMovieSearchResult[] } = await res.json();
      // El orden por popularidad puede moverse entre páginas: evitamos duplicados
      setMovies((prev) => {
        const seen = new Set(prev.map((m) => m.id));
        return [...prev, ...data.results.filter((m) => !seen.has(m.id))];
      });
      setPage((p) => p + 1);
    } catch {
      setError(true);
    }
    setLoading(false);
  }

  if (movies.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No encontramos películas con esos filtros en Perú. Prueba quitando alguno.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-xs text-muted-foreground">
        {shuffled ? "Selección al azar entre " : ""}
        {totalResults.toLocaleString("es-PE")}{" "}
        {totalResults === 1 ? "película" : "películas"}
        {" · "}mostrando {movies.length}
      </p>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {movies.map((movie, i) => (
          <MediaCard
            key={movie.id}
            // La animación escalonada solo para la tanda nueva, no para las 40 anteriores
            index={i % 20}
            href={`/movies/${movie.id}`}
            title={movie.title}
            subtitle={movie.release_date?.slice(0, 4)}
            posterUrl={getPosterUrl(movie.poster_path, "w342")}
          />
        ))}
      </div>

      {error && (
        <p className="text-sm text-destructive">
          No se pudieron cargar más películas. Intenta de nuevo.
        </p>
      )}

      {hasMore && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={loadMore} disabled={loading}>
            {loading ? "Cargando..." : "Ver más"}
          </Button>
        </div>
      )}
    </div>
  );
}
