import Image from "next/image";
import Link from "next/link";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getMovie, getPosterUrl } from "@/lib/tmdb";
import { db } from "@/lib/db";
import { mediaItems, ratings, profiles } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import { RatingForm } from "@/components/ratings/RatingForm";
import { ReviewList } from "@/components/ratings/ReviewList";

export default async function MoviePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tmdbId = Number(id);
  if (Number.isNaN(tmdbId)) notFound();

  const movie = await getMovie(tmdbId).catch(() => null);
  if (!movie) notFound();

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

  const posterUrl = getPosterUrl(movie.poster_path);
  const year = movie.release_date?.slice(0, 4);

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 p-8">
      <div className="flex flex-col gap-8 md:flex-row">
        {posterUrl && (
          <Image
            src={posterUrl}
            alt={movie.title}
            width={300}
            height={450}
            className="shrink-0"
          />
        )}
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-semibold">{movie.title}</h1>
            {year && <p className="text-muted-foreground">{year}</p>}
          </div>
          <p className="text-xs text-muted-foreground">
            TMDB: {movie.vote_average.toFixed(1)}/10
          </p>
          <p>{movie.overview}</p>
          <div className="flex flex-wrap gap-2">
            {movie.genres.map((g) => (
              <span key={g.id} className="border px-2 py-0.5 text-xs">
                {g.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {user ? (
        <section className="mt-10 space-y-4">
          <h2 className="text-xl font-semibold">Tu calificación</h2>
          <RatingForm
            key={userRating?.id ?? "new"}
            tmdbId={tmdbId}
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
  );
}
