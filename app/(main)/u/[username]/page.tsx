import { and, desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProfileRatingsTabs } from "@/components/profile/ProfileRatingsTabs";
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

  const movieRatings = await db
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

  const albumRatings = await db
    .select({
      stars: ratings.stars,
      title: mediaItems.title,
      posterUrl: mediaItems.posterUrl,
      externalId: mediaItems.externalId,
    })
    .from(ratings)
    .innerJoin(mediaItems, eq(ratings.mediaItemId, mediaItems.id))
    .where(
      and(eq(ratings.userId, profile.userId), eq(mediaItems.type, "album"))
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

      <ProfileRatingsTabs
        movieRatings={movieRatings}
        albumRatings={albumRatings}
      />
    </main>
  );
}
