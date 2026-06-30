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

async function tmdbFetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set("api_key", process.env.TMDB_API_KEY!);
  url.searchParams.set("language", "es-ES");
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`TMDB error: ${res.status}`);
  return res.json();
}

export function getPosterUrl(path: string | null, size: "w185" | "w342" | "w500" | "original" = "w500") {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

export function getBackdropUrl(path: string | null, size: "w780" | "w1280" | "original" = "w1280") {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

export function getProfileUrl(path: string | null, size: "w45" | "w185" = "w185") {
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

export async function getMovieCredits(tmdbId: number) {
  const data = await tmdbFetch<{ cast: CastMember[] }>(`/movie/${tmdbId}/credits`);
  return data.cast;
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

export async function discoverMovies(filters: {
  providers?: string[];
  genres: string[];
  acclaimed?: boolean;
  decade?: string;
  runtime?: string;
  page?: number;
  people?: number[];
}) {
  const params: Record<string, string> = {
    sort_by: "popularity.desc",
    "vote_count.gte": "80", // descartamos pelis muy desconocidas
    watch_region: "PE",
    page: String(filters.page ?? 1),
  };

  if (filters.providers?.length) {
    //"|" en TMDB significa OR: disponible en Netflix o Disney o cualquiera que seleccionemos
    params.with_watch_providers = filters.providers.join("|");
  }
  if (filters.genres?.length) {
    params.with_genres = filters.genres.join("|");
  }
  if (filters.acclaimed) {
    params["vote_average.gte"] = "7.5";
    params["vote_count.gte"] = "300"; // más votos = más confiable el score
  }

  // Décadas → rango de fechas
  const DECADES: Record<string, [string, string]> = {
    "90s":   ["1990-01-01", "1999-12-31"],
    "2000s": ["2000-01-01", "2009-12-31"],
    "2010s": ["2010-01-01", "2019-12-31"],
    "2020s": ["2020-01-01", "2029-12-31"],
  };
  if (filters.decade && DECADES[filters.decade]) {
    const [gte, lte] = DECADES[filters.decade];
    params["primary_release_date.gte"] = gte;
    params["primary_release_date.lte"] = lte;
  }

  // Duración en minutos
  if (filters.runtime === "short")  params["with_runtime.lte"] = "90";
  if (filters.runtime === "normal") {
    params["with_runtime.gte"] = "91";
    params["with_runtime.lte"] = "130";
  }
  if (filters.runtime === "long")   params["with_runtime.gte"] = "131";
  if (filters.people?.length) params.with_people = filters.people.join("|");

  const data = await tmdbFetch<TmdbSearchResponse>("/discover/movie", params);
  return data.results;
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

