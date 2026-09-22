"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ShuffleIcon } from "@phosphor-icons/react/dist/ssr";
import { MediaCard } from "@/components/media/MediaCard";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { getPosterUrl, type TmdbMovieSearchResult } from "@/lib/tmdb";
import { cn } from "@/lib/utils";

type Props = {
  initialMovies: TmdbMovieSearchResult[];
  startPage: number;
  totalPages: number;
  totalResults: number;
  // Filtros actuales como query string (sin page/shuffle), para pedir más páginas
  filterQuery: string;
  shuffled: boolean;
  // IDs TMDB que alguno de los dos ya vio (calificó o marcó como vista)
  seenIds: string[];
  kind: "movie" | "tv";
};

// Mientras DiscoverFilters está navegando (marca data-pending), los resultados
// viejos se atenúan. Funciona con CSS puro: el <main> de la página es
// group/discover y aquí preguntamos si "tiene" algo con data-pending.
const PENDING_DIM =
  "transition-opacity duration-200 group-has-[[data-pending]]/discover:pointer-events-none group-has-[[data-pending]]/discover:opacity-40";

export function DiscoverResults({
  initialMovies,
  startPage,
  totalPages,
  totalResults,
  filterQuery,
  shuffled,
  seenIds,
  kind,
}: Props) {
  const noun = kind === "tv" ? ["serie", "series"] : ["película", "películas"];
  const [movies, setMovies] = useState(initialMovies);
  const [page, setPage] = useState(startPage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [hideSeen, setHideSeen] = useState(false);
  const router = useRouter();
  const [isShuffling, startShuffle] = useTransition();

  // "Mezclar": misma búsqueda, página al azar (la elige el server según
  // cuántas hay). r es un valor único para que navegue aunque no cambie nada.
  function shuffle() {
    const r = Math.random().toString(36).slice(2, 8);
    startShuffle(() => {
      router.push(`/discover?${filterQuery}&shuffle=1&r=${r}`, { scroll: false });
    });
  }

  const hasMore = page < totalPages;
  const seenSet = new Set(seenIds);
  const seenCount = movies.filter((m) => seenSet.has(String(m.id))).length;
  const visible = hideSeen ? movies.filter((m) => !seenSet.has(String(m.id))) : movies;

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
      <p className={cn("text-sm text-muted-foreground", PENDING_DIM)}>
        No encontramos {noun[1]} con esos filtros en Perú. Prueba quitando alguno.
      </p>
    );
  }

  return (
    // data-pending al mezclar: atenúa la lista igual que al cambiar filtros
    <div className={cn("space-y-6", PENDING_DIM)} data-pending={isShuffling || undefined}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <p className="text-xs text-muted-foreground">
            {shuffled ? "Selección al azar entre " : ""}
            {totalResults.toLocaleString("es-PE")}{" "}
            {totalResults === 1 ? noun[0] : noun[1]}
            {" · "}mostrando {visible.length}
          </p>
          {totalPages > 1 && (
            <button
              type="button"
              onClick={shuffle}
              disabled={isShuffling}
              title="Otra tanda al azar con los mismos filtros"
              className="flex items-center gap-1 border border-foreground/25 px-2.5 py-1 text-xs text-foreground/80 transition-colors hover:border-foreground/70 hover:text-foreground disabled:opacity-50"
            >
              {isShuffling ? <Spinner size={12} /> : <ShuffleIcon size={12} />}
              Mezclar
            </button>
          )}
        </div>

        {seenCount > 0 && (
          <button
            type="button"
            onClick={() => setHideSeen((h) => !h)}
            aria-pressed={hideSeen}
            className={cn(
              "border px-2.5 py-1 text-xs transition-colors",
              hideSeen
                ? "border-amber-500 bg-amber-500 font-medium text-black"
                : "border-foreground/25 text-foreground/80 hover:border-foreground/70 hover:text-foreground"
            )}
          >
            {hideSeen ? "✓ " : ""}Ocultar las que ya vieron ({seenCount})
          </button>
        )}
      </div>

      {visible.length === 0 ? (
        <p className="text-sm text-muted-foreground animate-in fade-in duration-300">
          Ya vieron todas las de esta tanda.
          {hasMore ? " Prueba con «Ver más»." : ""}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 lg:gap-5">
          {visible.map((movie, i) => (
            <MediaCard
              key={movie.id}
              // La animación escalonada solo para la tanda nueva, no para las 40 anteriores
              index={i % 20}
              href={`${kind === "tv" ? "/series" : "/movies"}/${movie.id}`}
              title={movie.title}
              subtitle={movie.release_date?.slice(0, 4)}
              posterUrl={getPosterUrl(movie.poster_path, "w342")}
              seen={seenSet.has(String(movie.id))}
              rating={movie.vote_average}
              overview={movie.overview}
            />
          ))}
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive">
          No se pudieron cargar más {noun[1]}. Intenta de nuevo.
        </p>
      )}

      {hasMore && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={loadMore} disabled={loading}>
            {loading ? (
              <>
                <Spinner /> Cargando...
              </>
            ) : (
              "Ver más"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
