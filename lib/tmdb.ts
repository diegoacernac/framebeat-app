const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

export type TmdbMovieSearchResult = {
  id: number;
  title: string;
  release_date: string;
  poster_path: string | null;
  overview: string;
  vote_average: number;
};

export type TmdbMovieDetail = TmdbMovieSearchResult & {
  backdrop_path: string | null;
  genres: { id: number; name: string }[];
  runtime: number;
  tagline: string | null;
};

type TmdbSearchResponse = {
  results: TmdbMovieSearchResult[];
};

export type TmdbSeason = {
  id: number;
  name: string;
  overview: string;
  air_date: string | null;
  episode_count: number;
  poster_path: string | null;
  season_number: number;
};

export type TmdbTvSearchResult = {
  id: number;
  name: string;
  first_air_date: string;
  poster_path: string | null;
  overview: string;
  vote_average: number;
};

export type TmdbTvDetail = TmdbTvSearchResult & {
  backdrop_path: string | null;
  genres: { id: number; name: string }[];
  number_of_seasons: number;
  seasons: TmdbSeason[];
};

type TmdbTvSearchResponse = {
  results: TmdbTvSearchResult[];
};

export async function tmdbFetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set("api_key", process.env.TMDB_API_KEY!);
  url.searchParams.set("language", "es-MX");
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`TMDB error: ${res.status}`);
  return res.json();
}

export function getPosterUrl(path: string | null, size: "w92" | "w185" | "w342" | "w500" | "original" = "w500") {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

export function getBackdropUrl(path: string | null, size: "w780" | "w1280" | "original" = "w1280") {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

export function getProfileUrl(path: string | null, size: "w45" | "w185" | "h632" = "w185") {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

export type CastMember = {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
};

type CrewMember = {
  id: number;
  name: string;
  job: string;
};

// La misma respuesta trae reparto y equipo técnico: sacamos el director de ahí
export async function getMovieCredits(tmdbId: number) {
  const data = await tmdbFetch<{ cast: CastMember[]; crew: CrewMember[] }>(
    `/movie/${tmdbId}/credits`
  );
  return {
    cast: data.cast,
    directors: data.crew.filter((c) => c.job === "Director"),
  };
}

export async function getPopularMovies() {
  const data = await tmdbFetch<TmdbSearchResponse>("/movie/popular");
  return data.results;
}

export async function searchMovies(query: string) {
  if (!query.trim()) return [];
  const data = await tmdbFetch<TmdbSearchResponse>("/search/movie", { query });
  return data.results;
}

export async function getMovie(id: number) {
  return tmdbFetch<TmdbMovieDetail>(`/movie/${id}`);
}

export type WatchProvider = {
  provider_id: number;
  provider_name: string;
  logo_path: string;
  display_priority: number;
};

export type WatchProvidersByCountry = {
  link: string;
  flatrate?: WatchProvider[];
  rent?: WatchProvider[];
  buy?: WatchProvider[];
};

type TmdbWatchProvidersResponse = {
  results: Record<string, WatchProvidersByCountry>;
};

export function getProviderLogoUrl(logoPath: string | null, size: "w45" | "w92" = "w45") {
  if (!logoPath) return null;
  return `${TMDB_IMAGE_BASE}/${size}${logoPath}`;
}

export async function getMovieWatchProviders(
  movieId: number,
  country = "PE"
): Promise<WatchProvidersByCountry | null> {
  const data = await tmdbFetch<TmdbWatchProvidersResponse>(
    `/movie/${movieId}/watch/providers`
  );
  return data.results?.[country] ?? null;
}

// Qué cuenta como "tener dónde verla": suscripción, gratis, con anuncios,
// alquiler o compra. (TMDB: "|" = cualquiera de estos)
const ANY_MONETIZATION = "flatrate|free|ads|rent|buy";
// Talk shows (10767) y noticieros (10763) llenan las series populares sin ser
// "algo para ver juntos": los descartamos siempre
const TV_EXCLUDED_GENRES = "10767|10763";

// Descubrir películas o series con filtros. Las series se devuelven con la
// misma forma que las películas (title, release_date) para que la UI no
// tenga que distinguirlas.
export async function discoverMedia(filters: {
  kind?: "movie" | "tv";
  available?: boolean;
  providers?: string[];
  genres: string[];
  genreMatch?: "any" | "all";
  acclaimed?: boolean;
  decade?: string;
  runtime?: string;
  page?: number;
  people?: { id: number; department: string }[];
}) {
  const isTv = filters.kind === "tv";
  const params: Record<string, string> = {
    sort_by: "popularity.desc",
    "vote_count.gte": "80", // descartamos títulos muy desconocidos
    watch_region: "PE",
    page: String(filters.page ?? 1),
  };

  if (filters.available) {
    // Solo lo que tiene al menos una forma de verse en Perú
    params.with_watch_monetization_types = ANY_MONETIZATION;
  }
  if (filters.providers?.length) {
    //"|" en TMDB significa OR: disponible en Netflix o Disney o cualquiera que seleccionemos
    params.with_watch_providers = filters.providers.join("|");
  }
  if (filters.genres?.length) {
    // "|" = OR (cualquiera de los géneros), "," = AND (todos a la vez)
    params.with_genres = filters.genres.join(filters.genreMatch === "all" ? "," : "|");
  }
  if (isTv) params.without_genres = TV_EXCLUDED_GENRES;
  if (filters.acclaimed) {
    params["vote_average.gte"] = "7.5";
    params["vote_count.gte"] = "300"; // más votos = más confiable el score
  }

  // Décadas → rango de fechas (estreno en pelis, primera emisión en series)
  const DECADES: Record<string, [string, string]> = {
    "90s":   ["1990-01-01", "1999-12-31"],
    "2000s": ["2000-01-01", "2009-12-31"],
    "2010s": ["2010-01-01", "2019-12-31"],
    "2020s": ["2020-01-01", "2029-12-31"],
  };
  if (filters.decade && DECADES[filters.decade]) {
    const [gte, lte] = DECADES[filters.decade];
    const dateField = isTv ? "first_air_date" : "primary_release_date";
    params[`${dateField}.gte`] = gte;
    params[`${dateField}.lte`] = lte;
  }

  // Duración y personas: solo películas (TMDB no filtra series por persona)
  if (!isTv) {
    if (filters.runtime === "short")  params["with_runtime.lte"] = "90";
    if (filters.runtime === "normal") {
      params["with_runtime.gte"] = "91";
      params["with_runtime.lte"] = "130";
    }
    if (filters.runtime === "long")   params["with_runtime.gte"] = "131";
    if (filters.people?.length) {
      params.with_people = filters.people.map((p) => p.id).join("|");
      return discoverMoviesByPeople(params, filters.people, filters.page ?? 1);
    }
  }

  type Paged<T> = { results: T[]; total_pages: number; total_results: number };
  let results: TmdbMovieSearchResult[];
  let totalPages: number;
  let totalResults: number;

  if (isTv) {
    const data = await tmdbFetch<Paged<TmdbTvSearchResult>>("/discover/tv", params);
    results = data.results.map((tv) => ({
      id: tv.id,
      title: tv.name,
      release_date: tv.first_air_date,
      poster_path: tv.poster_path,
      overview: tv.overview,
      vote_average: tv.vote_average,
    }));
    totalPages = data.total_pages;
    totalResults = data.total_results;
  } else {
    const data = await tmdbFetch<Paged<TmdbMovieSearchResult>>("/discover/movie", params);
    results = data.results;
    totalPages = data.total_pages;
    totalResults = data.total_results;
  }

  // TMDB nunca deja pedir más de la página 500, aunque diga que hay más.
  return {
    results,
    totalPages: Math.min(totalPages, 500),
    totalResults,
  };
}

// Qué películas cuentan para una persona según su rol: si es director, solo
// las que dirigió (no las que produjo); si es actor, solo en las que actúa.
// Sin rol en la URL (links viejos con "undefined") usamos por lo que es
// conocida la persona según TMDB.
async function getPersonMovieIds(id: number, department: string) {
  const [data, role] = await Promise.all([
    tmdbFetch<{ cast: { id: number }[]; crew: { id: number; job: string }[] }>(
      `/person/${id}/movie_credits`
    ),
    department === "Directing" || department === "Acting"
      ? department
      : tmdbFetch<{ known_for_department: string }>(`/person/${id}`).then(
          (p) => p.known_for_department
        ),
  ]);
  department = role;
  if (department === "Directing") return data.crew.filter((c) => c.job === "Director").map((c) => c.id);
  if (department === "Acting") return data.cast.map((c) => c.id);
  return [...data.cast, ...data.crew].map((c) => c.id);
}

// with_people de TMDB incluye CUALQUIER crédito (Nolan como productor de
// "Batman vs Superman", por ejemplo). Traemos todas las páginas de esa
// búsqueda, dejamos solo las que coinciden con el rol de cada persona y
// paginamos nosotros. Las filmografías son cortas, así que son pocas páginas.
const PEOPLE_PAGE_SIZE = 20;
const PEOPLE_MAX_PAGES = 10;

async function discoverMoviesByPeople(
  params: Record<string, string>,
  people: { id: number; department: string }[],
  page: number
) {
  type Paged = { results: TmdbMovieSearchResult[]; total_pages: number };
  const [first, ...idLists] = await Promise.all([
    tmdbFetch<Paged>("/discover/movie", { ...params, page: "1" }),
    ...people.map((p) => getPersonMovieIds(p.id, p.department)),
  ]);
  const rest = await Promise.all(
    Array.from({ length: Math.min(first.total_pages, PEOPLE_MAX_PAGES) - 1 }, (_, i) =>
      tmdbFetch<Paged>("/discover/movie", { ...params, page: String(i + 2) })
    )
  );

  const allowed = new Set(idLists.flat());
  const seen = new Set<number>();
  const matches = [first, ...rest]
    .flatMap((d) => d.results)
    .filter((m) => allowed.has(m.id) && !seen.has(m.id) && seen.add(m.id));

  const start = (page - 1) * PEOPLE_PAGE_SIZE;
  return {
    results: matches.slice(start, start + PEOPLE_PAGE_SIZE),
    totalPages: Math.max(1, Math.ceil(matches.length / PEOPLE_PAGE_SIZE)),
    totalResults: matches.length,
  };
}

export async function getPopularTv() {
  const data = await tmdbFetch<TmdbTvSearchResponse>("/tv/popular");
  return data.results;
}

export async function searchTv(query: string) {
  if (!query.trim()) return [];
  const data = await tmdbFetch<TmdbTvSearchResponse>("/search/tv", { query });
  return data.results;
}

export async function getTv(id: number) {
  return tmdbFetch<TmdbTvDetail>(`/tv/${id}`);
}

export async function getTvCredits(tvId: number) {
  const data = await tmdbFetch<{ cast: CastMember[] }>(`/tv/${tvId}/credits`);
  return data.cast;
}

export async function getTvWatchProviders(tvId: number, country = "PE") : Promise<WatchProvidersByCountry | null> {
  const data = await tmdbFetch<TmdbWatchProvidersResponse>(`/tv/${tvId}/watch/providers`);
  return data.results?.[country] ?? null;
}

