import Link from "next/link";
import Image from "next/image";
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
import { getPopularMovies, getPopularTv, getPosterUrl } from "@/lib/tmdb";
import { PosterWall } from "@/components/marketing/PosterWall";
import { getMediaHref } from "@/lib/media";
import { ratingVisibleTo } from "@/lib/visibility";

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
        // Privacidad: las tuyas y las de títulos en listas que compartes
        // con su autor (ver lib/visibility.ts). Antes era de toda la app.
        .where(ratingVisibleTo(user.id))
        .orderBy(desc(ratings.createdAt))
        .limit(10),
    ]);

    const popularTvNormalized = popularTv.map((tv) => ({
      id: tv.id,
      title: tv.name,
      release_date: tv.first_air_date,
      poster_path: tv.poster_path,
      vote_average: tv.vote_average,
      overview: tv.overview,
    }));

    return (
      <main className="mx-auto w-full max-w-4xl lg:max-w-6xl flex-1 space-y-10 p-4 sm:p-8">
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
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">Actividad reciente</h2>
              <p className="text-xs text-muted-foreground">Tuya y de quienes comparten listas contigo.</p>
            </div>
            {/* En web, dos columnas: filas de ancho completo quedarían muy estiradas */}
            <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-x-10 lg:gap-y-4 lg:space-y-0">
              {recentReviews.map((r, i) => {
                const href = getMediaHref(r.mediaType, r.externalId);

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

  // Portada para visitantes: pósters populares de fondo (ambiente) y un
  // ejemplo de lista compartida, que es lo que distingue a la app
  const popularForWall = await getPopularMovies().catch(() => []);
  const wallPosters = popularForWall
    .map((m) => getPosterUrl(m.poster_path, "w185"))
    .filter((url): url is string => Boolean(url));
  const examplePosters = wallPosters.slice(0, 5);

  const features = [
    { title: "Descubre", text: "Qué ver esta noche según plataforma, género o director, con dónde verlo en Perú." },
    { title: "Listas compartidas", text: "Arma listas con tu pareja o amigos, márquenlas como vistas y dejen que la app sugiera más." },
    { title: "Califica", text: "Estrellas y reseñas de películas, temporadas y álbumes. Compara gustos en tus estadísticas." },
  ];

  return (
    // Sin fade-in: el título es el LCP de la portada y partir de opacidad 0
    // retrasa cuándo el navegador lo da por pintado
    <main className="flex-1">
      <section className="relative isolate overflow-hidden">
        <PosterWall posters={wallPosters} className="-z-10" />
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 py-24 text-center sm:py-32">
          <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl">FrameBeat</h1>
          <p className="max-w-xl text-lg text-balance text-muted-foreground">
            Decidan qué ver juntos, guarden lo pendiente en listas compartidas y califiquen lo que vieron.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Button size="lg" asChild>
              <Link href="/register">Crear cuenta gratis</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/discover">Explorar sin cuenta</Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="text-foreground underline-offset-4 hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-4xl gap-10 px-4 pb-20 sm:px-8 md:grid-cols-[minmax(0,1fr)_320px] md:items-center lg:max-w-6xl">
        <ul className="grid gap-3 sm:grid-cols-3 md:grid-cols-1">
          {features.map((f) => (
            <li key={f.title} className="space-y-1.5 border p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-amber-500">{f.title}</p>
              <p className="text-sm text-muted-foreground">{f.text}</p>
            </li>
          ))}
        </ul>

        {/* Cómo se ve una lista compartida (ilustrativo, con pósters reales) */}
        {examplePosters.length > 0 && (
          <figure className="space-y-3">
            <div className="space-y-4 border bg-card/60 p-4 shadow-2xl backdrop-blur">
              <div className="grid grid-cols-5 gap-1">
                {examplePosters.map((src) => (
                  <div key={src} className="relative aspect-[2/3] overflow-hidden bg-muted">
                    <Image src={src} alt="" fill sizes="64px" className="object-cover" />
                  </div>
                ))}
              </div>
              <div>
                <p className="font-medium">Maratón de viernes</p>
                <p className="mt-1 text-sm text-muted-foreground">Lo que tenemos pendiente</p>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    <span className="font-medium text-foreground">2</span>/5 vistas
                  </span>
                  <span>2 miembros</span>
                </div>
                <div className="h-0.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full w-2/5 bg-amber-500" />
                </div>
              </div>
            </div>
            <figcaption className="text-center text-xs text-muted-foreground">
              Así se ve una lista compartida
            </figcaption>
          </figure>
        )}
      </section>
    </main>
  );
}
