import Link from "next/link";
import { CastRow } from "@/components/media/CastRow";
import { DetailHero } from "@/components/media/DetailHero";
import { TrailerButton } from "@/components/media/TrailerButton";
import { ExpandableText } from "@/components/ui/expandable-text";
import { RateShortcut } from "@/components/ratings/RateShortcut";
import { eq, and } from "drizzle-orm";
import { ratingVisibleTo } from "@/lib/visibility";
import { notFound } from "next/navigation";
import { getMovie, getPosterUrl, getBackdropUrl, getMovieWatchProviders, getMovieCredits, getTrailer } from "@/lib/tmdb";
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

  const [movie, watchProviders, credits, trailer] = await Promise.all([
    getMovie(tmdbId).catch(() => null),
    getMovieWatchProviders(tmdbId).catch(() => null),
    getMovieCredits(tmdbId).catch(() => ({ cast: [], directors: [] })),
    getTrailer("movie", tmdbId).catch(() => null),
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
      // Privacidad: solo las tuyas y las de quienes comparten contigo una
      // lista con este título (ver lib/visibility.ts)
      .where(and(eq(ratings.mediaItemId, mediaItem.id), ratingVisibleTo(user?.id)));

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
      <DetailHero
        title={movie.title}
        backdropUrl={backdropUrl}
        posterUrl={posterUrl}
        head={
          <>
            <h1 className="text-2xl font-semibold leading-tight text-balance sm:text-3xl md:text-4xl">
              {movie.title}
            </h1>
            {movie.tagline && (
              <p className="hidden italic text-muted-foreground sm:block">{movie.tagline}</p>
            )}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-sm text-muted-foreground">
              {year && <span>{year}</span>}
              {runtime && <span>{runtime}</span>}
              {movie.vote_average > 0 && (
                <span className="font-medium text-amber-500">
                  ★ {movie.vote_average.toFixed(1)}
                  <span className="font-normal text-muted-foreground">/10</span>
                </span>
              )}
            </div>
            {directors.length > 0 && (
              <p className="text-sm text-muted-foreground">
                <span className="hidden sm:inline">Dirigida por </span>
                <span className="sm:hidden">De </span>
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
          </>
        }
      >
        <div className="flex flex-wrap gap-2">
          {movie.genres.map((g) => (
            <span key={g.id} className="border border-foreground/15 bg-background/40 px-2 py-0.5 text-xs backdrop-blur">
              {g.name}
            </span>
          ))}
        </div>

        {movie.overview && (
          <ExpandableText
            text={movie.overview}
            className="max-w-3xl text-sm leading-relaxed text-muted-foreground"
          />
        )}

        {(trailer || user) && (
          <div className="flex flex-wrap items-start gap-2">
            {trailer && <TrailerButton trailer={trailer} title={movie.title} />}
            {user && (
            <>
            <AddToListButton
              lists={myLists}
              mediaType="movie"
              externalId={String(tmdbId)}
              title={movie.title}
              // Mismo tamaño que usa el buscador de la lista
              posterUrl={getPosterUrl(movie.poster_path, "w185")}
              metadata={{ overview: movie.overview, year }}
            />
            <RateShortcut href="#calificar" stars={userRating?.stars ?? null} />
            </>
            )}
          </div>
        )}
      </DetailHero>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 pb-8 sm:px-8 lg:max-w-6xl">
        <section className="mt-8">
          <WatchProviders providers={watchProviders} title={movie.title} />
        </section>

        {/* Calificar va antes del reparto: es lo principal que se hace aquí */}
        {user ? (
          <section id="calificar" className="mt-10 scroll-mt-24 space-y-4">
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

        {topCast.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Reparto
            </h2>
            <CastRow cast={topCast} />
          </section>
        )}

        {/* Sin sesión no hay reseñas que mostrar: son privadas */}
        {user && (
          <section className="mt-10 space-y-4">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold">Reseñas</h2>
              <p className="text-xs text-muted-foreground">
                Solo ves tus reseñas y las de quienes comparten contigo una lista con este título.
              </p>
            </div>
            <ReviewList reviews={allReviews} />
          </section>
        )}
      </main>
    </>
  );
}
