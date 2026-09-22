"use client";

import { useState } from "react";
import Image from "next/image";
import { XIcon } from "@phosphor-icons/react/dist/ssr";
import { useDebouncedFetch } from "@/hooks/useDebouncedFetch";
import { useAddToList } from "@/hooks/useAddToList";
import { Input } from "../ui/input";
import { Spinner } from "../ui/spinner";
import { AddFeedback, AddMediaButton } from "./AddMediaButton";
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
  // Lo que ya está en la lista ("movie:123"), para marcarlo en los resultados
  existingKeys: string[];
};

export function ListAddMovieSearch({ listId, kind = "movie", existingKeys }: Props) {
  const [query, setQuery] = useState("");
  const { add, isInList, isAdding, feedback } = useAddToList(listId, existingKeys);

  const searchUrl = kind === "tv" ? "/api/series/search" : "/api/movies/search";
  const trimmed = query.trim();
  const { data, loading, error } = useDebouncedFetch<{ results?: MovieResult[] }>(
    trimmed ? `${searchUrl}?q=${encodeURIComponent(trimmed)}` : null
  );
  const results = data?.results ?? [];

  return (
    <div className="space-y-3">
      <div className="relative">
        <Input
          placeholder={kind === "tv" ? "Buscar serie para añadir..." : "Buscar película para añadir..."}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pr-8"
        />
        {/* Los resultados se quedan al añadir (para elegir varias de la misma
            búsqueda): se limpian a mano */}
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Limpiar búsqueda"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <XIcon size={14} />
          </button>
        )}
      </div>

      {loading && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Spinner size={12} /> Buscando...
        </p>
      )}
      {!loading && error && (
        <p className="text-xs text-destructive">No se pudo buscar. Intenta de nuevo.</p>
      )}

      <AddFeedback feedback={feedback} />

      <ul className="space-y-2">
        {results.map((movie, i) => {
          const inList = isInList(kind, movie.id);
          const poster = getPosterUrl(movie.poster_path, "w92");
          return (
            <li
              key={movie.id}
              className={cn(
                "flex items-center gap-3 border p-2 text-sm transition-colors",
                "animate-in fade-in slide-in-from-top-1 fill-mode-both duration-200",
                inList && "border-amber-500/40 bg-amber-500/5"
              )}
              style={{ animationDelay: `${i * 30}ms` }}
            >
              {/* Poster chico: ayuda a distinguir entre títulos casi iguales */}
              <div className="relative aspect-[2/3] w-9 shrink-0 overflow-hidden bg-muted">
                {poster && <Image src={poster} alt="" fill sizes="36px" className="object-cover" />}
              </div>
              <span className="min-w-0 flex-1">
                {movie.title}{" "}
                <span className="text-muted-foreground">
                  ({movie.release_date?.slice(0, 4) || "s/f"})
                </span>
              </span>
              <AddMediaButton
                inList={inList}
                adding={isAdding(kind, movie.id)}
                onAdd={() =>
                  add({
                    id: movie.id,
                    type: kind,
                    title: movie.title,
                    year: movie.release_date?.slice(0, 4) || null,
                    posterPath: movie.poster_path,
                    overview: movie.overview,
                  })
                }
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
