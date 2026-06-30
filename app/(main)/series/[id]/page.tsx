import Image from "next/image";
import Link from "next/link";
import { eq, and, inArray, like } from "drizzle-orm";
import { notFound } from "next/navigation";
import {
  getTv,
  getPosterUrl,
  getBackdropUrl,
  getTvWatchProviders,
  getTvCredits,
  getProfileUrl,
} from "@/lib/tmdb";
import { db } from "@/lib/db";
import { mediaItems, ratings, profiles } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import { RatingForm } from "@/components/ratings/RatingForm";
import { ReviewList } from "@/components/ratings/ReviewList";
import { WatchProviders } from "@/components/movies/WatchProviders";
import { SeasonPicker } from "@/components/series/SeasonPicker";

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
        .where(inArray(ratings.mediaItemId, seasonMediaItemIds))
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

  const posterUrl = getPosterUrl(tv.poster_path);
  const backdropUrl = getBackdropUrl(tv.backdrop_path);
  const year = tv.first_air_date?.slice(0, 4);

  return (
    <>
      {backdropUrl && (
        <div className="relative h-48 w-full overflow-hidden md:h-64">
          <Image
            src={backdropUrl}
            alt={tv.name}
            fill
            className="object-cover object-top"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        </div>
      )}

      <main className="mx-auto w-full max-w-4xl flex-1 p-4 sm:p-8">
        <div className="flex flex-col gap-8 md:flex-row">
          {posterUrl && (
            <Image
              src={posterUrl}
              alt={tv.name}
              width={200}
              height={300}
              className="shrink-0 rounded-sm shadow-lg"
            />
          )}
          <div className="space-y-4">
            <div className="space-y-1">
              <h1 className="text-3xl font-semibold">{tv.name}</h1>
              <div className="flex flex-wrap items-center gap-3 pt-1 text-sm text-muted-foreground">
                {year && <span>{year}</span>}
                <span>{tv.number_of_seasons} temporadas</span>
                {tv.vote_average > 0 && (
                  <span className="text-amber-500 font-medium">
                    ★ {tv.vote_average.toFixed(1)}
                    <span className="text-muted-foreground font-normal">/10</span>
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {tv.genres.map((g) => (
                <span key={g.id} className="border px-2 py-0.5 text-xs">
                  {g.name}
                </span>
              ))}
            </div>

            <p className="text-sm leading-relaxed text-muted-foreground">
              {tv.overview}
            </p>
          </div>
        </div>

        <section className="mt-8">
          <WatchProviders providers={watchProviders} />
        </section>

        {topCast.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Reparto
            </h2>
            <div className="scrollbar-none flex gap-4 overflow-x-auto pb-2">
              {topCast.map((actor) => (
                <div key={actor.id} className="w-16 shrink-0 space-y-1.5">
                  <div className="relative h-16 w-16 overflow-hidden rounded-full bg-muted">
                    {actor.profile_path ? (
                      <Image
                        src={getProfileUrl(actor.profile_path)!}
                        alt={actor.name}
                        fill
                        className="object-cover object-top"
                        sizes="64px"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground text-lg">
                        ?
                      </div>
                    )}
                  </div>
                  <p className="line-clamp-2 text-center text-xs font-medium leading-tight">
                    {actor.name}
                  </p>
                  <p className="line-clamp-1 text-center text-xs text-muted-foreground">
                    {actor.character}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="mt-10 space-y-6">
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
                    key={myRating?.id ?? externalId}
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
      </main>
    </>
  );
}
