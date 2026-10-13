"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useDebouncedFetch } from "@/hooks/useDebouncedFetch";
import { MediaCard } from "./MediaCard";
import { MediaCardSkeleton } from "./MediaCardSkeleton";
import { getPosterUrl } from "@/lib/tmdb";
import { SectionLabel } from "@/components/ui/section-label";
import { BuildingsIcon } from "@phosphor-icons/react/dist/ssr";

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
  const { data, loading, error } = useDebouncedFetch<{
    results?: MovieResult[];
    studio?: { id: number; name: string; total: number; results: MovieResult[] } | null;
  }>(trimmed ? `${searchUrl}?q=${encodeURIComponent(trimmed)}` : null);
  // Si lo buscado es un estudio ("marvel"), sus películas van primero y los
  // resultados por título debajo, sin repetir las que ya salieron arriba
  const studio = trimmed ? data?.studio ?? null : null;
  const studioIds = new Set(studio?.results.map((m) => m.id));
  const results = (trimmed ? data?.results ?? [] : initialResults).filter((m) => !studioIds.has(m.id));

  const renderCard = (movie: MovieResult, i: number) => (
    <MediaCard
      key={movie.id}
      index={i}
      eager={i < 4}
      href={`${hrefBase}/${movie.id}`}
      title={movie.title}
      subtitle={movie.release_date?.slice(0, 4)}
      posterUrl={getPosterUrl(movie.poster_path, "w342")}
      rating={movie.vote_average}
      overview={movie.overview ?? ""}
    />
  );
  const gridClass = "grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 lg:gap-5";

  const showingInitial = !trimmed && initialResults.length > 0;

  return (
    <div className="space-y-6">
      <Input
        placeholder={kind === "tv" ? "Buscar series..." : "Buscar películas..."}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {showingInitial && (
        <SectionLabel as="p">
          Populares ahora
        </SectionLabel>
      )}

      {!loading && studio && (
        <section className="space-y-4 animate-in fade-in duration-300">
          <div className="flex items-baseline gap-2">
            <BuildingsIcon size={16} className="self-center text-primary" />
            <h2 className="font-medium">{studio.name}</h2>
            <span className="text-sm text-muted-foreground">
              · {studio.total} películas · las más populares
            </span>
          </div>
          <div className={gridClass}>{studio.results.slice(0, 10).map(renderCard)}</div>
        </section>
      )}

      {!loading && studio && results.length > 0 && <SectionLabel as="p">Por título</SectionLabel>}

      <div className={gridClass}>
        {loading ? <MediaCardSkeleton count={10} /> : results.map(renderCard)}
      </div>

      {!loading && error && (
        <p className="text-sm text-destructive">
          No se pudo buscar. Intenta de nuevo.
        </p>
      )}

      {!loading && !error && trimmed && results.length === 0 && !studio && (
        <p className="text-sm text-muted-foreground">
          {kind === "tv" ? "No se encontraron series." : "No se encontraron películas."}
        </p>
      )}
    </div>
  );
}
