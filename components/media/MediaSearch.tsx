"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { MediaCard } from "./MediaCard";
import { MediaCardSkeleton } from "./MediaCardSkeleton";
import { getPosterUrl } from "@/lib/tmdb";

type MovieResult = {
  id: number;
  title: string;
  release_date: string;
  poster_path: string | null;
};

type Props = {
  initialResults?: MovieResult[];
};

export function MediaSearch({ initialResults = [] }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MovieResult[]>(initialResults);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults(initialResults);
      setLoading(false);
      return;
    }

    setLoading(true);

    const timer = setTimeout(async () => {
      const res = await fetch(
        `/api/movies/search?q=${encodeURIComponent(query)}`
      );
      const data = await res.json();
      setResults(data.results ?? []);
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const showingInitial = !query.trim() && initialResults.length > 0;

  return (
    <div className="space-y-6">
      <Input
        placeholder="Buscar películas..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {showingInitial && (
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          Populares ahora
        </p>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {loading ? (
          <MediaCardSkeleton />
        ) : (
          results.map((movie, i) => (
            <MediaCard
              key={movie.id}
              index={i}
              href={`/movies/${movie.id}`}
              title={movie.title}
              subtitle={movie.release_date?.slice(0, 4)}
              posterUrl={getPosterUrl(movie.poster_path, "w342")}
            />
          ))
        )}
      </div>

      {!loading && query.trim() && results.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No se encontraron películas.
        </p>
      )}
    </div>
  );
}
