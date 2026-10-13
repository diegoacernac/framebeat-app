"use client";

import { MediaCard } from "@/components/media/MediaCard";
import { Stat } from "@/components/ui/stat";

type RatingItem = {
  stars: number;
  title: string;
  posterUrl: string | null;
  externalId: string;
  year: string | null;
};

function RatingsGrid({
  items,
  hrefPrefix,
  emptyMessage,
  aspectRatio,
}: {
  items: RatingItem[];
  hrefPrefix: "/movies" | "/albums";
  emptyMessage: string;
  aspectRatio: "poster" | "square";
}) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 lg:gap-5">
      {items.map((rating, i) => (
        <MediaCard
          key={rating.externalId}
          index={i}
          eager={i < 4}
          aspectRatio={aspectRatio}
          href={`${hrefPrefix}/${rating.externalId}`}
          title={rating.title}
          subtitle={rating.year ?? undefined}
          posterUrl={rating.posterUrl}
          showStars={rating.stars}
        />
      ))}
    </div>
  );
}

function avg(items: RatingItem[]) {
  if (!items.length) return null;
  return items.reduce((sum, r) => sum + r.stars, 0) / items.length;
}

export function ProfileRatingsTabs({
  movieRatings,
  albumRatings,
}: {
  movieRatings: RatingItem[];
  albumRatings: RatingItem[];
}) {
  const total = movieRatings.length + albumRatings.length;
  const avgMovies = avg(movieRatings);
  const avgAlbums = avg(albumRatings);

  return (
    <div className="space-y-6">
      {total > 0 && (
        <div className="flex flex-wrap gap-8 border-b pb-6">
          <Stat variant="inline" value={total} label="Calificaciones" />
          {avgMovies !== null && (
            <Stat variant="inline" accent value={avgMovies.toFixed(1)} suffix="/5" label="Prom. películas" />
          )}
          {avgAlbums !== null && (
            <Stat variant="inline" value={avgAlbums.toFixed(1)} suffix="/5" label="Prom. álbumes" />
          )}
        </div>
      )}
      <RatingsGrid
      items={movieRatings}
      hrefPrefix="/movies"
      aspectRatio="poster"
      emptyMessage="Aún no hay películas calificadas."
    />
    </div>
  );
}
