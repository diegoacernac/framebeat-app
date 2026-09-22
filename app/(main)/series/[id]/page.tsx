import Image from "next/image";
import Link from "next/link";
import { CastRow } from "@/components/media/CastRow";
import { DetailHero } from "@/components/media/DetailHero";
import { ExpandableText } from "@/components/ui/expandable-text";
import { RateShortcut } from "@/components/ratings/RateShortcut";
import { eq, and, inArray, like } from "drizzle-orm";
import { ratingVisibleTo } from "@/lib/visibility";
import { notFound } from "next/navigation";
import {
  getTv,
  getPosterUrl,
  getBackdropUrl,
  getTvWatchProviders,
  getTvCredits,
} from "@/lib/tmdb";
import { db } from "@/lib/db";
import { mediaItems, ratings, profiles } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import { RatingForm } from "@/components/ratings/RatingForm";
import { ReviewList } from "@/components/ratings/ReviewList";
import { WatchProviders } from "@/components/movies/WatchProviders";
import { SeasonPicker } from "@/components/series/SeasonPicker";
import { AddToListButton } from "@/components/lists/AddToListButton";
import { getUserListsWithMedia } from "@/lib/lists";

export default async function SeriesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ season?: string }>;
}) {
  const { id } = await params;
  const { season } = await searchParams;
  const tvId = Number(id);
  if (Number.isNaN(tvId)) notFound();

  const [tv, watchProviders, cast] = await Promise.all([
    getTv(tvId).catch(() => null),
    getTvWatchProviders(tvId).catch(() => null),
    getTvCredits(tvId).catch(() => []),
  ]);
  if (!tv) notFound();
  const topCast = cast.slice(0, 12);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Cada temporada es su propio media_item con externalId "{tvId}-s{n}".
  // Las traemos todas juntas para no hacer una query por temporada.
  const seasonMediaItems = await db.query.mediaItems.findMany({
    where: and(
      eq(mediaItems.type, "tv"),
      like(mediaItems.externalId, `${tvId}-s%`)
    ),
  });
  const seasonMediaItemIds = seasonMediaItems.map((m) => m.id);

  const seasonRatings = seasonMediaItemIds.length
    ? await db
        .select({
          id: ratings.id,
          stars: ratings.stars,
          review: ratings.review,
          createdAt: ratings.createdAt,
          userId: ratings.userId,
          mediaItemId: ratings.mediaItemId,
          username: profiles.username,
          displayName: profiles.displayName,
          avatarUrl: profiles.avatarUrl,
        })
        .from(ratings)
        .innerJoin(profiles, eq(ratings.userId, profiles.userId))
        // Privacidad: solo las tuyas y las de quienes comparten contigo una
        // lista con esta serie (ver lib/visibility.ts)
        .where(and(inArray(ratings.mediaItemId, seasonMediaItemIds), ratingVisibleTo(user?.id)))
    : [];

  const realSeasons = tv.seasons.filter((s) => s.season_number > 0);
  const requestedSeason = Number(season);
  const selectedSeasonNumber = realSeasons.some(
    (s) => s.season_number === requestedSeason
  )
    ? requestedSeason
    : realSeasons[0]?.season_number ?? 1;
  const selectedSeason = realSeasons.find(
    (s) => s.season_number === selectedSeasonNumber
  );

  // En las listas se guarda la serie completa (externalId = tvId), no por temporada
  const myLists = user
    ? await getUserListsWithMedia(user.id, "tv", String(tvId))
    : [];

  const posterUrl = getPosterUrl(tv.poster_path);
  const backdropUrl = getBackdropUrl(tv.backdrop_path);
  const year = tv.first_air_date?.slice(0, 4);

  return (
    <>
      <DetailHero
        title={tv.name}
        backdropUrl={backdropUrl}
        posterUrl={posterUrl}
        head={
          <>
            <h1 className="text-2xl font-semibold leading-tight text-balance sm:text-3xl md:text-4xl">
              {tv.name}
            </h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-sm text-muted-foreground">
              {year && <span>{year}</span>}
              <span>
                {tv.number_of_seasons} {tv.number_of_seasons === 1 ? "temporada" : "temporadas"}
              </span>
              {tv.vote_average > 0 && (
                <span className="font-medium text-amber-500">
                  ★ {tv.vote_average.toFixed(1)}
                  <span className="font-normal text-muted-foreground">/10</span>
                </span>
              )}
            </div>
          </>
        }
      >
        <div className="flex flex-wrap gap-2">
          {tv.genres.map((g) => (
            <span key={g.id} className="border border-foreground/15 bg-background/40 px-2 py-0.5 text-xs backdrop-blur">
              {g.name}
            </span>
          ))}
        </div>

        {tv.overview && (
          <ExpandableText
            text={tv.overview}
            className="max-w-3xl text-sm leading-relaxed text-muted-foreground"
          />
        )}

        {user && (
          <div className="flex flex-wrap items-start gap-2">
            <AddToListButton
              lists={myLists}
              mediaType="tv"
              externalId={String(tvId)}
              title={tv.name}
              posterUrl={getPosterUrl(tv.poster_path, "w185")}
              metadata={{ overview: tv.overview, year }}
            />
            {/* Las series se califican por temporada: lleva a esa sección */}
            <RateShortcut href="#temporadas" stars={null} label="Calificar temporadas" />
          </div>
        )}
      </DetailHero>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 pb-8 sm:px-8 lg:max-w-6xl">
        <section className="mt-8">
          <WatchProviders providers={watchProviders} title={tv.name} />
        </section>

        <section id="temporadas" className="mt-10 scroll-mt-24 space-y-6">
          <h2 className="text-xl font-semibold">Temporadas</h2>

          <SeasonPicker seasons={realSeasons} selected={selectedSeasonNumber} />

          {selectedSeason && (() => {
            const externalId = `${tvId}-s${selectedSeason.season_number}`;
            const mediaItem = seasonMediaItems.find(
              (m) => m.externalId === externalId
            );
            const reviews = mediaItem
              ? seasonRatings.filter((r) => r.mediaItemId === mediaItem.id)
              : [];
            const myRating = user
              ? reviews.find((r) => r.userId === user.id) ?? null
              : null;
            const seasonPosterUrl = getPosterUrl(
              selectedSeason.poster_path,
              "w185"
            );

            return (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  {seasonPosterUrl && (
                    <Image
                      src={seasonPosterUrl}
                      alt={selectedSeason.name}
                      width={60}
                      height={90}
                      className="shrink-0 self-start rounded-sm"
                    />
                  )}
                  <div>
                    <p className="font-medium">{selectedSeason.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedSeason.episode_count} episodios
                      {selectedSeason.air_date &&
                        ` · ${selectedSeason.air_date.slice(0, 4)}`}
                    </p>
                  </div>
                </div>

                {user ? (
                  <RatingForm
                    key={externalId} // solo reinicia el formulario al cambiar de temporada
                    mediaType="tv"
                    externalId={externalId}
                    title={`${tv.name} — ${selectedSeason.name}`}
                    posterUrl={seasonPosterUrl}
                    metadata={{
                      tvId,
                      seasonNumber: selectedSeason.season_number,
                      overview: selectedSeason.overview,
                    }}
                    initialStars={myRating?.stars ?? 0}
                    initialReview={myRating?.review}
                    ratingId={myRating?.id}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    <Link href="/login" className="underline">
                      Inicia sesión
                    </Link>{" "}
                    para calificar esta temporada.
                  </p>
                )}

                <ReviewList reviews={reviews} />
              </div>
            );
          })()}
        </section>
        {topCast.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Reparto
            </h2>
            <CastRow cast={topCast} />
          </section>
        )}
      </main>
    </>
  );
}
