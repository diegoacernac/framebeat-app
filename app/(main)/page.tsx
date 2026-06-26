import Link from "next/link";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { ratings, mediaItems, profiles } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";

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
      })
      .from(ratings)
      .innerJoin(mediaItems, eq(ratings.mediaItemId, mediaItems.id))
      .innerJoin(profiles, eq(ratings.userId, profiles.userId))
      .where(eq(mediaItems.type, "movie"))
      .orderBy(desc(ratings.createdAt))
      .limit(10);

    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.userId, user.id),
    });
    if (!profile) redirect("/onboarding/username");

    return (
      <main className="mx-auto w-full max-w-2xl flex-1 space-y-8 p-8">
        <div className="space-y-2 text-center">
          <h1 className="text-4xl font-semibold">FrameBeat</h1>
          <p className="text-muted-foreground">Hola, @{profile.username}</p>
        </div>

        {recentReviews.length > 0 ? (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Últimas reseñas</h2>
            {recentReviews.map((r) => (
              <article
                key={`${r.username}-${r.externalId}-${r.createdAt.toISOString()}`}
                className="border-b pb-4 text-sm"
              >
                <p>
                  <Link
                    href={`/u/${r.username}`}
                    className="font-medium hover:underline"
                  >
                    @{r.username}
                  </Link>
                  {" calificó "}
                  <Link
                    href={`/movies/${r.externalId}`}
                    className="hover:underline"
                  >
                    {r.title}
                  </Link>{" "}
                  {"★".repeat(r.stars)}
                </p>
                {r.review && (
                  <p className="mt-1 text-muted-foreground">{r.review}</p>
                )}
              </article>
            ))}
          </section>
        ) : (
          <p className="text-center text-sm text-muted-foreground">
            Aún no hay reseñas.{" "}
            <Link href="/search" className="underline">
              Busca una película
            </Link>{" "}
            para empezar.
          </p>
        )}
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="space-y-2">
        <h1 className="text-4xl font-semibold">FrameBeat</h1>
        <p className="text-muted-foreground">
          Califica lo que ves y escuchas
        </p>
      </div>
    </main>
  );
}
