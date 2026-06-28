import { discoverMovies, getPosterUrl } from "@/lib/tmdb";
import { DiscoverFilters } from "@/components/discover/DiscoverFilters";
import { MediaCard } from "@/components/media/MediaCard";
import { Person } from "../../../components/discover/PeopleSearch";

const MOOD_GENRES: Record<string, string[]> = {
  cenar:    ["35", "12"],
  profunda: ["18", "36"],
  reir:     ["35"],
  accion:   ["28", "12"],
  suspenso: ["53", "9648"],
  scifi:    ["878"],
  romance:  ["10749", "18"],
};

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{
    providers?: string;
    mood?: string;
    acclaimed?: string;
    decade?: string;
    runtime?: string;
    page?: string;
    people?: string;
  }>;
}) {
  const params = await searchParams;

  const providers = params.providers?.split(",").filter(Boolean) ?? [];
  const mood = params.mood ?? "";
  const genres = MOOD_GENRES[mood] ?? [];
  const acclaimed = params.acclaimed === "1";
  const decade = params.decade ?? "";
  const runtime = params.runtime ?? "";
  const page = Number(params.page ?? "1");
  // "123:Christopher Nolan:Directing,456:Tom Hanks:Acting"
  const peopleRaw = params.people ?? "";
  const people = peopleRaw
    ? peopleRaw.split(",").map((s) => {
        const [id, name, department] = s.split(":");
        return { id: Number(id), name, department };
      })
    : [];

  const hasFilters =
    providers.length > 0 ||
    genres.length > 0 ||
    acclaimed ||
    decade !== "" ||
    runtime !== "" ||
    people.length > 0;

  const movies = hasFilters
    ? await discoverMovies({ 
        providers, genres, acclaimed, decade, runtime, page, 
        people: people.map((p) => p.id),
      })
    : [];

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 space-y-8 p-4 sm:p-8 animate-in fade-in duration-300">
      <h1 className="text-2xl font-semibold">¿Qué vemos?</h1>

      <DiscoverFilters
        initialProviders={providers}
        initialMood={mood}
        initialAcclaimed={acclaimed}
        initialDecade={decade}
        initialRuntime={runtime}
        initialPeople={people}
      />

      {hasFilters && (
        movies.length > 0 ? (
          <>
            <p className="text-xs text-muted-foreground">{movies.length} resultados</p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {movies.map((movie, i) => (
                <MediaCard
                  key={movie.id}
                  index={i}
                  href={`/movies/${movie.id}`}
                  title={movie.title}
                  subtitle={movie.release_date?.slice(0, 4)}
                  posterUrl={getPosterUrl(movie.poster_path, "w342")}
                />
              ))}
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            No encontramos películas con esos filtros en Perú. Probá quitando alguno.
          </p>
        )
      )}

      {!hasFilters && (
        <p className="text-sm text-muted-foreground">
          Selecciona al menos una plataforma o situación para ver opciones.
        </p>
      )}
    </main>
  );
}
