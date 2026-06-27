"use client";

import Image from "next/image";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MediaCard } from "@/components/media/MediaCard";

type RatingItem = {
  stars: number;
  title: string;
  posterUrl: string | null;
  externalId: string;
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
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {items.map((rating, i) => (
        <MediaCard
          key={rating.externalId}
          index={i}
          aspectRatio={aspectRatio}
          href={`${hrefPrefix}/${rating.externalId}`}
          title={rating.title}
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
        <div className="flex flex-wrap gap-6 text-sm border-b pb-6">
          <div>
            <p className="text-2xl font-semibold">{total}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">calificaciones</p>
          </div>
          {avgMovies !== null && (
            <div>
              <p className="text-2xl font-semibold text-amber-500">{avgMovies.toFixed(1)}<span className="text-base text-muted-foreground">/5</span></p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">prom. películas</p>
            </div>
          )}
          {avgAlbums !== null && (
            <div>
              <p className="text-2xl font-semibold text-violet-400">{avgAlbums.toFixed(1)}<span className="text-base text-muted-foreground">/5</span></p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">prom. álbumes</p>
            </div>
          )}
        </div>
      )}
      <Tabs defaultValue="movies">
      <TabsList>
        <TabsTrigger value="movies">
          Películas ({movieRatings.length})
        </TabsTrigger>
        <TabsTrigger value="albums">
          Álbumes ({albumRatings.length})
        </TabsTrigger>
      </TabsList>
      <TabsContent value="movies" className="mt-4 space-y-4">
        <RatingsGrid
          items={movieRatings}
          hrefPrefix="/movies"
          aspectRatio="poster"
          emptyMessage="Aún no hay películas calificadas."
        />
      </TabsContent>
      <TabsContent value="albums" className="mt-4 space-y-4">
        <RatingsGrid
          items={albumRatings}
          hrefPrefix="/albums"
          aspectRatio="square"
          emptyMessage="Aún no hay álbumes calificados."
        />
      </TabsContent>
    </Tabs>
    </div>
  );
}
