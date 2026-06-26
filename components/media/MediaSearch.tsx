"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { MediaCard } from "./MediaCard";
import { getPosterUrl } from "@/lib/tmdb";

type MovieResult = {
  id: number;
  title: string;
  release_date: string;
  poster_path: string | null;
};
export function MediaSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MovieResult[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      const res = await fetch(`/api/movies/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data.results ?? []);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);
  return (
    <div className="space-y-6">
      <Input
        placeholder="Buscar películas..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {loading && <p className="text-sm text-muted-foreground">Buscando...</p>}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {results.map((movie) => (
          <MediaCard
            key={movie.id}
            id={movie.id}
            title={movie.title}
            year={movie.release_date?.slice(0, 4)}
            posterUrl={getPosterUrl(movie.poster_path, "w185")}
          />
        ))}
      </div>
    </div>
  );
}