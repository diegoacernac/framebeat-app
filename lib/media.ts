export type MediaType = "movie" | "album" | "tv";

// Ruta de la ficha según el tipo de media.
// Las reseñas de series son por temporada, con externalId "{tvId}-s{n}":
// esas van a /series/{tvId}?season={n}.
export function getMediaHref(type: MediaType, externalId: string) {
  if (type === "album") return `/albums/${externalId}`;
  if (type === "tv") {
    const season = externalId.match(/^(\d+)-s(\d+)$/);
    return season
      ? `/series/${season[1]}?season=${season[2]}`
      : `/series/${externalId}`;
  }
  return `/movies/${externalId}`;
}
