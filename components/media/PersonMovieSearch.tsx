"use client";

import { useRef, useState } from "react";
import { PeopleSearch, type Person } from "@/components/discover/PeopleSearch";
import { MediaCard } from "./MediaCard";
import { MediaCardSkeleton } from "./MediaCardSkeleton";
import { getPosterUrl } from "@/lib/tmdb";

type Movie = {
  id: number;
  title: string;
  release_date: string;
  poster_path: string | null;
};

export function PersonMovieSearch() {
  const [person, setPerson] = useState<Person | null>(null);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  // Cancela la petición anterior si se elige otra persona antes de que responda
  const abortRef = useRef<AbortController | null>(null);

  async function handleChange(people: Person[]) {
    abortRef.current?.abort();

    if (people.length === 0) {
      setPerson(null);
      setMovies([]);
      setLoading(false);
      setError(false);
      return;
    }

    const selected = people[people.length - 1];
    const controller = new AbortController();
    abortRef.current = controller;
    setPerson(selected);
    setLoading(true);
    setError(false);

    try {
      const res = await fetch(`/api/people/${selected.id}/movies`, {
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setMovies(data.movies ?? []);
    } catch {
      if (controller.signal.aborted) return;
      setMovies([]);
      setError(true);
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <PeopleSearch
        selected={person ? [person] : []}
        onChange={handleChange}
      />

      {person && !loading && error && (
        <p className="text-sm text-destructive">
          No se pudo cargar la filmografía. Intenta de nuevo.
        </p>
      )}

      {person && !loading && !error && (
        <p className="text-xs text-muted-foreground">
          Filmografía de{" "}
          <span className="font-medium text-foreground">{person.name}</span>
          {" · "}
          {movies.length} películas
        </p>
      )}

      {(loading || movies.length > 0) && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {loading ? (
            <MediaCardSkeleton />
          ) : (
            movies.map((movie, i) => (
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
      )}
    </div>
  );
}
