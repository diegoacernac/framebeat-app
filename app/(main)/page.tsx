import Link from "next/link";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { ratings, mediaItems, profiles } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import { FeedReviewCard } from "@/components/feed/FeedReviewCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MediaSearch } from "@/components/media/MediaSearch";
import { PersonMovieSearch } from "@/components/media/PersonMovieSearch";
import { getPopularMovies, getPopularTv } from "@/lib/tmdb";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.userId, user.id),
    });
    if (!profile) redirect("/onboarding/username");

    const [popular, popularTv, recentReviews] = await Promise.all([
      getPopularMovies().catch(() => []),
      getPopularTv().catch(() => []),
      db
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
        .limit(10),
    ]);

    const popularTvNormalized = popularTv.map((tv) => ({
      id: tv.id,
      title: tv.name,
      release_date: tv.first_air_date,
      poster_path: tv.poster_path,
    }));

    return (
      <main className="mx-auto w-full max-w-4xl flex-1 space-y-10 p-4 sm:p-8 animate-in fade-in duration-500">
        <Tabs defaultValue="title">
          <TabsList>
            <TabsTrigger value="title">Por título</TabsTrigger>
            <TabsTrigger value="series">Series</TabsTrigger>
            <TabsTrigger value="person">Por actor o director</TabsTrigger>
          </TabsList>
          <TabsContent value="title" className="mt-6">
            <MediaSearch initialResults={popular} />
          </TabsContent>
          <TabsContent value="series" className="mt-6">
            <MediaSearch kind="tv" initialResults={popularTvNormalized} />
          </TabsContent>
          <TabsContent value="person" className="mt-6">
            <PersonMovieSearch />
          </TabsContent>
        </Tabs>

        {recentReviews.length > 0 && (
          <section className="space-y-4 border-t pt-8">
            <h2 className="text-lg font-semibold">Actividad reciente</h2>
            <div className="space-y-4">
              {recentReviews.map((r, i) => {
                const href =
                  r.mediaType === "album"
                    ? `/albums/${r.externalId}`
                    : r.mediaType === "tv"
                      ? `/series/${r.externalId}`
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
        )}
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-12 p-4 sm:p-8 text-center animate-in fade-in duration-500">
      <div className="space-y-4 max-w-lg">
        <h1 className="text-5xl font-semibold tracking-tight">FrameBeat</h1>
        <p className="text-lg text-muted-foreground">
          Tu diario de lo que ves y escuchas
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl w-full text-left">
        <div className="border p-4 space-y-2">
          <p className="text-xs uppercase tracking-wider text-amber-500 font-medium">Califica</p>
          <p className="text-sm text-muted-foreground">Pon estrellas y escribe reseñas de películas y álbumes.</p>
        </div>
        <div className="border p-4 space-y-2">
          <p className="text-xs uppercase tracking-wider text-amber-500 font-medium">Descubre</p>
          <p className="text-sm text-muted-foreground">Ve dónde ver cada película en streaming en Perú.</p>
        </div>
        <div className="border p-4 space-y-2">
          <p className="text-xs uppercase tracking-wider text-amber-500 font-medium">Comparte</p>
          <p className="text-sm text-muted-foreground">Un feed compartido con lo que están viendo y escuchando.</p>
        </div>
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
