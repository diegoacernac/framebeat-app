import Image from "next/image";
import Link from "next/link";
import { CastRow } from "@/components/media/CastRow";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getMovie, getPosterUrl, getBackdropUrl, getMovieWatchProviders, getMovieCredits } from "@/lib/tmdb";
import { db } from "@/lib/db";
import { mediaItems, ratings, profiles } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import { RatingForm } from "@/components/ratings/RatingForm";
import { ReviewList } from "@/components/ratings/ReviewList";
import { WatchProviders } from "../../../../components/movies/WatchProviders";
import { AddToListButton } from "@/components/lists/AddToListButton";
import { getUserListsWithMedia } from "@/lib/lists";
import { getPersonDiscoverHref } from "@/lib/discover";

function formatRuntime(minutes: number) {
  if (!minutes) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default async function MoviePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tmdbId = Number(id);
  if (Number.isNaN(tmdbId)) notFound();

  const [movie, watchProviders, credits] = await Promise.all([
    getMovie(tmdbId).catch(() => null),
    getMovieWatchProviders(tmdbId).catch(() => null),
    getMovieCredits(tmdbId).catch(() => ({ cast: [], directors: [] })),
  ]);
  if (!movie) notFound();
  const topCast = credits.cast.slice(0, 12);
  const directors = credits.directors;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const mediaItem = await db.query.mediaItems.findFirst({
    where: and(
      eq(mediaItems.type, "movie"),
      eq(mediaItems.externalId, String(tmdbId))
    ),
  });

  let userRating = null;
  let allReviews: Array<{
    id: string;
    stars: number;
    review: string | null;
    createdAt: Date;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  }> = [];

  if (mediaItem) {
    const dbRatings = await db
      .select({
        id: ratings.id,
        stars: ratings.stars,
        review: ratings.review,
        createdAt: ratings.createdAt,
        userId: ratings.userId,
        username: profiles.username,
        displayName: profiles.displayName,
        avatarUrl: profiles.avatarUrl,
      })
      .from(ratings)
      .innerJoin(profiles, eq(ratings.userId, profiles.userId))
      .where(eq(ratings.mediaItemId, mediaItem.id));

    allReviews = dbRatings;
    if (user) {
      userRating = dbRatings.find((r) => r.userId === user.id) ?? null;
    }
  }

  const myLists = user
    ? await getUserListsWithMedia(user.id, "movie", String(tmdbId))
    : [];

  const posterUrl = getPosterUrl(movie.poster_path);
  const backdropUrl = getBackdropUrl(movie.backdrop_path);
  const year = movie.release_date?.slice(0, 4);
  const runtime = formatRuntime(movie.runtime);

  return (
    <>
      {backdropUrl && (
        <div className="relative h-48 w-full overflow-hidden md:h-64">
          <Image
            src={backdropUrl}
            alt={movie.title}
            fill
            className="object-cover object-top"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        </div>
      )}

      <main className="mx-auto w-full max-w-4xl flex-1 p-4 sm:p-8 lg:max-w-6xl">
        <div className="flex flex-col gap-8 md:flex-row">
          {posterUrl && (
            <Image
              src={posterUrl}
              alt={movie.title}
              width={200}
              height={300}
              // self-start + aspect fijo: si la columna de texto crece (sinopsis
              // larga, menú de listas abierto) el poster no se estira con ella
              className="aspect-[2/3] h-auto w-[200px] shrink-0 self-start rounded-sm object-cover shadow-lg"
            />
          )}
          <div className="space-y-4">
            <div className="space-y-1">
              <h1 className="text-3xl font-semibold">{movie.title}</h1>
              {movie.tagline && (
                <p className="italic text-muted-foreground">{movie.tagline}</p>
              )}
              <div className="flex flex-wrap items-center gap-3 pt-1 text-sm text-muted-foreground">
                {year && <span>{year}</span>}
                {runtime && <span>{runtime}</span>}
                {movie.vote_average > 0 && (
                  <span className="text-amber-500 font-medium">
                    ★ {movie.vote_average.toFixed(1)}
                    <span className="text-muted-foreground font-normal">/10</span>
                  </span>
                )}
              </div>
              {directors.length > 0 && (
                <p className="pt-1 text-sm text-muted-foreground">
                  Dirigida por{" "}
                  {directors.map((d, i) => (
                    <span key={d.id}>
                      {i > 0 && (i === directors.length - 1 ? " y " : ", ")}
                      <Link
                        href={getPersonDiscoverHref(d.id, d.name, "Directing")}
                        className="font-medium text-foreground underline-offset-4 transition-colors hover:text-amber-500 hover:underline"
                      >
                        {d.name}
                      </Link>
                    </span>
                  ))}
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {movie.genres.map((g) => (
                <span key={g.id} className="border px-2 py-0.5 text-xs">
                  {g.name}
                </span>
              ))}
            </div>

            <p className="text-sm leading-relaxed text-muted-foreground">
              {movie.overview}
            </p>

            {user && (
              <AddToListButton
                lists={myLists}
                mediaType="movie"
                externalId={String(tmdbId)}
                title={movie.title}
                // Mismo tamaño que usa el buscador de la lista
                posterUrl={getPosterUrl(movie.poster_path, "w185")}
                metadata={{ overview: movie.overview, year }}
              />
            )}
          </div>
        </div>

        <section className="mt-8">
          <WatchProviders providers={watchProviders} title={movie.title} />
        </section>

        {topCast.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Reparto
            </h2>
            <CastRow cast={topCast} />
          </section>
        )}

        {user ? (
          <section className="mt-10 space-y-4">
            <h2 className="text-xl font-semibold">Tu calificación</h2>
            <RatingForm
              mediaType="movie"
              externalId={String(tmdbId)}
              title={movie.title}
              posterUrl={posterUrl}
              metadata={{
                overview: movie.overview,
                year,
                genres: movie.genres,
              }}
              initialStars={userRating?.stars ?? 0}
              initialReview={userRating?.review}
              ratingId={userRating?.id}
            />
          </section>
        ) : (
          <p className="mt-10 text-sm text-muted-foreground">
            <Link href="/login" className="underline">
              Inicia sesión
            </Link>{" "}
            para calificar.
          </p>
        )}

        <section className="mt-10 space-y-4">
          <h2 className="text-xl font-semibold">Reseñas</h2>
          <ReviewList reviews={allReviews} />
        </section>
      </main>
    </>
  );
}
