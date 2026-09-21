// TMDB no da un link directo a la ficha del título dentro de cada plataforma,
// así que armamos la URL de búsqueda de cada una y le pasamos el título.
// IDs de provider de TMDB para Perú (mismos que usa DiscoverFilters).
const PROVIDER_SEARCH_URL: Record<number, (title: string) => string> = {
  8: (title) => `https://www.netflix.com/search?q=${encodeURIComponent(title)}`,
  119: (title) =>
    `https://www.primevideo.com/search/ref=atv_nb_sr?phrase=${encodeURIComponent(title)}`,
  337: (title) =>
    `https://www.disneyplus.com/search?q=${encodeURIComponent(title)}`,
  350: (title) => `https://tv.apple.com/search?term=${encodeURIComponent(title)}`,
  384: (title) => `https://play.max.com/search?q=${encodeURIComponent(title)}`,
};

export function getProviderLink(
  providerId: number,
  title: string,
  fallbackLink: string
) {
  return PROVIDER_SEARCH_URL[providerId]?.(title) ?? fallbackLink;
}
