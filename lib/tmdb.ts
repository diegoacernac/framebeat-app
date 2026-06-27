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

async function tmdbFetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set("api_key", process.env.TMDB_API_KEY!);
  url.searchParams.set("language", "es-ES");
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`TMDB error: ${res.status}`);
  return res.json();
}

export function getPosterUrl(path: string | null, size: "w185" | "w500" | "original" = "w500") {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

export function getBackdropUrl(path: string | null, size: "w780" | "w1280" | "original" = "w1280") {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
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


