import Image from "next/image";
import Link from "next/link";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { formatTrackDuration, getAlbum, getAlbumCoverUrl } from "@/lib/spotify";
import { db } from "@/lib/db";
import { mediaItems, ratings, profiles } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import { RatingForm } from "@/components/ratings/RatingForm";
import { ReviewList } from "@/components/ratings/ReviewList";
import { Button } from "@/components/ui/button";

export default async function AlbumPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const album = await getAlbum(id).catch(() => null);
  if (!album) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const mediaItem = await db.query.mediaItems.findFirst({
    where: and(
      eq(mediaItems.type, "album"),
      eq(mediaItems.externalId, id)
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

  const coverUrl = getAlbumCoverUrl(album.images);
  const year = album.release_date?.slice(0, 4);
  const artists = album.artists.map((a) => a.name).join(", ");

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 p-8">
      <div className="flex flex-col gap-8 md:flex-row">
        {coverUrl && (
          <Image
            src={coverUrl}
            alt={album.name}
            width={300}
            height={300}
            className="shrink-0"
          />
        )}
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-semibold">{album.name}</h1>
            <p className="text-muted-foreground">{artists}</p>
            {year && <p className="text-sm text-muted-foreground">{year}</p>}
          </div>
          <p className="text-sm text-muted-foreground">
            {album.total_tracks} canciones
          </p>
          <Button asChild variant="outline">
            <a
              href={album.external_urls.spotify}
              target="_blank"
              rel="noopener noreferrer"
            >
              Escuchar en Spotify
            </a>
          </Button>
        </div>
      </div>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold">Tracklist</h2>
        <ul className="divide-y text-sm">
          {album.tracks.items.map((track) => (
            <li
              key={track.track_number}
              className="flex items-center justify-between py-2"
            >
              <span>
                {track.track_number}. {track.name}
              </span>
              <span className="text-muted-foreground">
                {formatTrackDuration(track.duration_ms)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {user ? (
        <section className="mt-10 space-y-4">
          <h2 className="text-xl font-semibold">Tu calificación</h2>
          <RatingForm
            key={userRating?.id ?? "new"}
            mediaType="album"
            externalId={id}
            title={album.name}
            posterUrl={coverUrl}
            metadata={{
              artists: album.artists,
              year,
              totalTracks: album.total_tracks,
              spotifyUrl: album.external_urls.spotify,
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
