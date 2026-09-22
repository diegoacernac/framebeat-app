import { and, desc, eq, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { MediaCard } from "@/components/media/MediaCard";
import { db } from "@/lib/db";
import { mediaItems, ratings } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import { getMediaHref } from "@/lib/media";

// Estadísticas: solo las tuyas. Antes se comparaba contra "tu pareja" (la
// primera persona con la que compartías una lista), lo que con listas con
// distintas personas mezclaba todo y no tenía sentido en un modelo privado.

// metadata.year lo guardan los botones de calificar ("2014")
function getYear(metadata: unknown) {
  const year = (metadata as { year?: unknown } | null)?.year;
  return year ? String(year) : undefined;
}

function StatTile({ value, label, accent = false }: { value: string; label: string; accent?: boolean }) {
  return (
    <div className="border p-5">
      <p className={accent ? "text-3xl font-bold tabular-nums text-amber-500" : "text-3xl font-bold tabular-nums"}>
        {value}
      </p>
      <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}

export default async function StatsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Películas y temporadas de series (los álbumes son otro mundo)
  const mine = await db
    .select({
      stars: ratings.stars,
      mediaItemId: ratings.mediaItemId,
      title: mediaItems.title,
      posterUrl: mediaItems.posterUrl,
      externalId: mediaItems.externalId,
      type: mediaItems.type,
      metadata: mediaItems.metadata,
    })
    .from(ratings)
    .innerJoin(mediaItems, eq(ratings.mediaItemId, mediaItems.id))
    .where(and(eq(ratings.userId, user.id), inArray(mediaItems.type, ["movie", "tv"])))
    .orderBy(desc(ratings.updatedAt));

  if (mine.length === 0) {
    return (
      <main className="mx-auto w-full max-w-4xl flex-1 space-y-4 p-4 sm:p-8 lg:max-w-6xl">
        <h1 className="text-2xl font-semibold">Estadísticas</h1>
        <p className="text-sm text-muted-foreground">
          Aún no has calificado nada.{" "}
          <Link href="/" className="text-amber-500 hover:underline">
            Busca una para empezar.
          </Link>
        </p>
      </main>
    );
  }

  const movies = mine.filter((r) => r.type === "movie").length;
  const seasons = mine.filter((r) => r.type === "tv").length;
  const average = mine.reduce((sum, r) => sum + r.stars, 0) / mine.length;

  // Cuántas de cada nota (de 5 a 1)
  const distribution = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: mine.filter((r) => r.stars === stars).length,
  }));
  const maxCount = Math.max(...distribution.map((d) => d.count));

  // Mejor calificadas; a igual nota, las más recientes primero (sort estable)
  const favorites = [...mine].sort((a, b) => b.stars - a.stars).slice(0, 6);

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 space-y-8 p-4 sm:p-8 lg:max-w-6xl animate-in fade-in duration-300">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Estadísticas</h1>
        <p className="text-sm text-muted-foreground">Tus calificaciones de películas y temporadas.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile value={String(mine.length)} label="Calificadas" accent />
        <StatTile value={`★ ${average.toFixed(1)}`} label="Promedio" accent />
        <StatTile value={String(movies)} label={movies === 1 ? "Película" : "Películas"} />
        <StatTile value={String(seasons)} label={seasons === 1 ? "Temporada" : "Temporadas"} />
      </div>

      {/* Cómo repartes tus notas: barras horizontales de 5 a 1 estrella */}
      <section className="space-y-3 border p-5">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Cómo calificas</p>
        <ul className="space-y-2">
          {distribution.map(({ stars, count }) => (
            <li key={stars} className="grid grid-cols-[4.5rem_minmax(0,1fr)_2.5rem] items-center gap-3 text-sm">
              <span className="text-amber-500" aria-label={`${stars} estrellas`}>
                {"★".repeat(stars)}
              </span>
              <div className="h-2 overflow-hidden bg-muted">
                <div
                  className="h-full bg-amber-500 transition-[width] duration-500"
                  style={{ width: maxCount ? `${(count / maxCount) * 100}%` : "0%" }}
                />
              </div>
              <span className="text-right tabular-nums text-muted-foreground">{count}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Tus favoritas</p>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4 lg:grid-cols-6 lg:gap-5">
          {favorites.map((m, i) => (
            <MediaCard
              key={m.mediaItemId}
              index={i}
              href={getMediaHref(m.type, m.externalId)}
              title={m.title}
              subtitle={getYear(m.metadata)}
              posterUrl={m.posterUrl}
              showStars={m.stars}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
