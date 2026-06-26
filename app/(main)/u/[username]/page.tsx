import { and, desc, eq } from "drizzle-orm";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { db } from "@/lib/db";
import { mediaItems, profiles, ratings } from "@/lib/db/schema";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.username, username.toLowerCase()),
  });

  if (!profile) notFound();

  const userRatings = await db
    .select({
      stars: ratings.stars,
      title: mediaItems.title,
      posterUrl: mediaItems.posterUrl,
      externalId: mediaItems.externalId,
    })
    .from(ratings)
    .innerJoin(mediaItems, eq(ratings.mediaItemId, mediaItems.id))
    .where(
      and(eq(ratings.userId, profile.userId), eq(mediaItems.type, "movie"))
    )
    .orderBy(desc(ratings.createdAt));

  const initials = profile.username.slice(0, 2).toUpperCase();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-8">
      <div className="flex items-center gap-4">
        <Avatar className="size-16">
          {profile.avatarUrl && (
            <AvatarImage src={profile.avatarUrl} alt={profile.username} />
          )}
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-semibold">
            {profile.displayName ?? profile.username}
          </h1>
          <p className="text-muted-foreground">@{profile.username}</p>
        </div>
      </div>
      {profile.bio && <p className="text-sm">{profile.bio}</p>}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">
          {userRatings.length} película{userRatings.length !== 1 && "s"}{" "}
          calificada{userRatings.length !== 1 && "s"}
        </h2>
        {userRatings.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aún no hay calificaciones.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {userRatings.map((rating) => (
              <Link
                key={rating.externalId}
                href={`/movies/${rating.externalId}`}
                className="space-y-2"
              >
                {rating.posterUrl ? (
                  <div className="relative aspect-[2/3] overflow-hidden bg-muted">
                    <Image
                      src={rating.posterUrl}
                      alt={rating.title}
                      fill
                      className="object-cover"
                      sizes="150px"
                    />
                  </div>
                ) : (
                  <div className="flex aspect-[2/3] items-center justify-center bg-muted text-xs text-muted-foreground">
                    Sin poster
                  </div>
                )}
                <p className="line-clamp-2 text-sm font-medium">{rating.title}</p>
                <p className="text-xs text-muted-foreground">
                  {"★".repeat(rating.stars)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
