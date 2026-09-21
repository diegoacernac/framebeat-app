import { discoverMovies } from "@/lib/tmdb";
import { parseDiscoverParams } from "@/lib/discover";
import { DiscoverFilters } from "@/components/discover/DiscoverFilters";
import { DiscoverResults } from "@/components/discover/DiscoverResults";

type DiscoverFiltersInput = Omit<Parameters<typeof discoverMovies>[0], "page">;
type DiscoverPageResult = Awaited<ReturnType<typeof discoverMovies>>;

// "Mezclar": elige una página al azar entre las que existen para estos filtros.
// Primero preguntamos cuántas páginas hay realmente, así el azar respeta el
// pool real en vez de un rango fijo inventado.
async function discoverRandomPage(filters: DiscoverFiltersInput) {
  const first = await discoverMovies({ ...filters, page: 1 });
  const maxPage = Math.min(first.totalPages, 20); // ~400 resultados como techo
  const page = Math.floor(Math.random() * maxPage) + 1;
  const result = page === 1 ? first : await discoverMovies({ ...filters, page });
  return { result, page };
}

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
    shuffle?: string;
    r?: string;
  }>;
}) {
  const params = await searchParams;
  const { filters, people, mood, hasFilters } = parseDiscoverParams(params);
  const shuffle = params.shuffle === "1";

  let result: DiscoverPageResult | null = null;
  let startPage = 1;

  if (hasFilters) {
    if (shuffle) {
      ({ result, page: startPage } = await discoverRandomPage(filters));
    } else {
      startPage = Math.max(1, Number(params.page) || 1);
      result = await discoverMovies({ ...filters, page: startPage });
    }
  }

  // Query string solo con los filtros: "Ver más" le suma &page=N
  const filterQuery = new URLSearchParams(
    Object.entries({
      providers: params.providers,
      mood: params.mood,
      acclaimed: params.acclaimed,
      decade: params.decade,
      runtime: params.runtime,
      people: params.people,
    }).filter((entry): entry is [string, string] => Boolean(entry[1]))
  ).toString();

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 space-y-8 p-4 sm:p-8 animate-in fade-in duration-300">
      <h1 className="text-2xl font-semibold">¿Qué vemos?</h1>

      <DiscoverFilters
        initialProviders={filters.providers}
        initialMood={mood}
        initialAcclaimed={filters.acclaimed}
        initialDecade={filters.decade}
        initialRuntime={filters.runtime}
        initialPeople={people}
      />

      {result ? (
        <DiscoverResults
          // Nueva búsqueda o nuevo "Mezclar" (cambia r) → reinicia la lista acumulada
          key={`${filterQuery}|${params.r ?? ""}|${startPage}`}
          initialMovies={result.results}
          startPage={startPage}
          totalPages={result.totalPages}
          totalResults={result.totalResults}
          filterQuery={filterQuery}
          shuffled={shuffle}
        />
      ) : (
        <p className="text-sm text-muted-foreground">
          Selecciona al menos una plataforma o situación para ver opciones.
        </p>
      )}
    </main>
  );
}
