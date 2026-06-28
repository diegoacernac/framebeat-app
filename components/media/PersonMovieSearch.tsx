"use client";

import { useState } from "react";
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

  async function handleChange(people: Person[]) {
    if (people.length === 0) {
      setPerson(null);
      setMovies([]);
      return;
    }

    const selected = people[people.length - 1];
    setPerson(selected);
    setLoading(true);

    const res = await fetch(`/api/people/${selected.id}/movies`);
    const data = await res.json();
    setMovies(data.movies ?? []);
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <PeopleSearch
        selected={person ? [person] : []}
        onChange={handleChange}
      />

      {person && !loading && (
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
