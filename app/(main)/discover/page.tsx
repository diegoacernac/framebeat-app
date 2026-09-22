import { discoverMedia } from "@/lib/tmdb";
import { parseDiscoverParams, type DiscoverKind } from "@/lib/discover";
import { DiscoverFilters } from "@/components/discover/DiscoverFilters";
import { DiscoverResults } from "@/components/discover/DiscoverResults";
import { createClient } from "@/lib/supabase/server";
import { getPartnerUserIds } from "@/lib/lists";
import { getSeenIds } from "@/lib/seen";

type DiscoverFiltersInput = Omit<Parameters<typeof discoverMedia>[0], "page">;
type DiscoverPageResult = Awaited<ReturnType<typeof discoverMedia>>;

// "Mezclar": elige una página al azar entre las que existen para estos filtros.
// Primero preguntamos cuántas páginas hay realmente, así el azar respeta el
// pool real en vez de un rango fijo inventado.
async function discoverRandomPage(filters: DiscoverFiltersInput) {
  const first = await discoverMedia({ ...filters, page: 1 });
  const maxPage = Math.min(first.totalPages, 20); // ~400 resultados como techo
  const page = Math.floor(Math.random() * maxPage) + 1;
  const result = page === 1 ? first : await discoverMedia({ ...filters, page });
  return { result, page };
}

// Lo que tú o tu pareja ya vieron (vacío si no hay sesión)
async function getCoupleSeenIds(kind: DiscoverKind) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Set<string>();

  const partners = await getPartnerUserIds(user.id);
  return getSeenIds([user.id, ...partners], kind);
}

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{
    type?: string;
    avail?: string;
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
  const { kind, filters, people, mood, hasFilters } = parseDiscoverParams(params);
  const shuffle = params.shuffle === "1";

  let result: DiscoverPageResult | null = null;
  let startPage = 1;
  let seenIds: string[] = [];

  // Sin filtros también se busca: lo más popular con dónde ver en Perú.
  // Así la página nunca abre vacía.
  {
    startPage = Math.max(1, Number(params.page) || 1);
    // TMDB y "qué ya vieron" en paralelo: no dependen uno del otro
    const [discovered, seen] = await Promise.all([
      shuffle
        ? discoverRandomPage(filters)
        : discoverMedia({ ...filters, page: startPage }).then((r) => ({
            result: r,
            page: startPage,
          })),
      getCoupleSeenIds(kind),
    ]);
    result = discovered.result;
    startPage = discovered.page;
    seenIds = [...seen];
  }

  // Query string solo con los filtros: "Ver más" le suma &page=N
  const filterQuery = new URLSearchParams(
    Object.entries({
      type: params.type,
      avail: params.avail,
      providers: params.providers,
      mood: params.mood,
      acclaimed: params.acclaimed,
      decade: params.decade,
      runtime: params.runtime,
      people: params.people,
    }).filter((entry): entry is [string, string] => Boolean(entry[1]))
  ).toString();

  return (
    // group/discover: mientras DiscoverFilters navega (data-pending), los
    // resultados se atenúan vía CSS (ver DiscoverResults)
    <main className="group/discover mx-auto w-full max-w-4xl lg:max-w-6xl flex-1 space-y-8 p-4 sm:p-8">
      <h1 className="text-2xl font-semibold">¿Qué vemos?</h1>

      <DiscoverFilters
        initialKind={kind}
        initialAvailable={filters.available}
        initialProviders={filters.providers}
        initialMood={mood}
        initialAcclaimed={filters.acclaimed}
        initialDecade={filters.decade}
        initialRuntime={filters.runtime}
        initialPeople={people}
        // Siempre plegados al entrar: primero se ven las películas
        initialCollapsed
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
          seenIds={seenIds}
          kind={kind}
          popular={!hasFilters}
        />
      ) : (
        <p className="text-sm text-muted-foreground">
          No se pudieron cargar resultados. Intenta de nuevo.
        </p>
      )}
    </main>
  );
}
