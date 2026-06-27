import Link from "next/link";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { ratings, mediaItems, profiles } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import { FeedReviewCard } from "@/components/feed/FeedReviewCard";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const recentReviews = await db
      .select({
        stars: ratings.stars,
        review: ratings.review,
        createdAt: ratings.createdAt,
        username: profiles.username,
        title: mediaItems.title,
        externalId: mediaItems.externalId,
        mediaType: mediaItems.type,
        posterUrl: mediaItems.posterUrl,
      })
      .from(ratings)
      .innerJoin(mediaItems, eq(ratings.mediaItemId, mediaItems.id))
      .innerJoin(profiles, eq(ratings.userId, profiles.userId))
      .orderBy(desc(ratings.createdAt))
      .limit(10);

    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.userId, user.id),
    });
    if (!profile) redirect("/onboarding/username");

    return (
      <main className="mx-auto w-full max-w-2xl flex-1 space-y-8 p-8 animate-in fade-in duration-500">
        <div className="space-y-2 text-center">
          <h1 className="text-4xl font-semibold tracking-tight">FrameBeat</h1>
          <p className="text-muted-foreground">Hola, @{profile.username}</p>
        </div>

        {recentReviews.length > 0 ? (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Últimas reseñas</h2>
            <div className="space-y-4">
              {recentReviews.map((r, i) => {
                const href =
                  r.mediaType === "album"
                    ? `/albums/${r.externalId}`
                    : `/movies/${r.externalId}`;

                return (
                  <FeedReviewCard
                    key={`${r.username}-${r.externalId}-${r.createdAt.toISOString()}`}
                    index={i}
                    username={r.username}
                    title={r.title}
                    href={href}
                    mediaType={r.mediaType}
                    stars={r.stars}
                    review={r.review}
                    posterUrl={r.posterUrl}
                  />
                );
              })}
            </div>
          </section>
        ) : (
          <div className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">
              Aún no hay reseñas en la comunidad.
            </p>
            <Button asChild>
              <Link href="/search">Buscar algo para calificar</Link>
            </Button>
          </div>
        )}
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 p-8 text-center animate-in fade-in duration-500">
      <div className="space-y-2">
        <h1 className="text-4xl font-semibold tracking-tight">FrameBeat</h1>
        <p className="text-muted-foreground">
          Tu diario de lo que ves y escuchas
        </p>
      </div>
      <div className="flex gap-3">
        <Button variant="outline" asChild>
          <Link href="/login">Entrar</Link>
        </Button>
        <Button asChild>
          <Link href="/register">Registrarse</Link>
        </Button>
      </div>
    </main>
  );
}