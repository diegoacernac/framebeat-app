import { and, desc, eq, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { MediaCard } from "@/components/media/MediaCard";
import { db } from "@/lib/db";
import { mediaItems, profiles, ratings } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import { getPartnerUserIds } from "@/lib/lists";
import { ratingVisibleTo } from "@/lib/visibility";
import { getMediaHref } from "@/lib/media";

// metadata.year lo guardan los botones de calificar ("2014")
function getYear(metadata: unknown) {
  const year = (metadata as { year?: unknown } | null)?.year;
  return year ? String(year) : undefined;
}

function avg(arr: number[]) {
  if (!arr.length) return 0;
  return arr.reduce((s, n) => s + n, 0) / arr.length;
}

// "3 películas · 2 temporadas" (omite lo que esté en 0)
function breakdown(rs: { type: string }[]) {
  const movies = rs.filter((r) => r.type === "movie").length;
  const seasons = rs.filter((r) => r.type === "tv").length;
  return [
    movies > 0 && `${movies} ${movies === 1 ? "película" : "películas"}`,
    seasons > 0 && `${seasons} ${seasons === 1 ? "temporada" : "temporadas"}`,
  ]
    .filter(Boolean)
    .join(" · ");
}

type RatedItem = {
  stars: number;
  mediaItemId: string;
  title: string;
  posterUrl: string | null;
  externalId: string;
  type: "movie" | "tv" | "album";
  metadata: unknown;
};

// Las cartas de "Tú" y "Tu pareja" comparten formato
function PersonStat({
  label,
  name,
  rs,
  average,
}: {
  label: string;
  name: string;
  rs: RatedItem[];
  average: number;
}) {
  return (
    <div className="border p-5 text-center">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 truncate font-semibold">{name}</p>
      <p className="mt-4 text-4xl font-bold tabular-nums text-amber-500">{rs.length}</p>
      <p className="text-xs text-muted-foreground">calificadas</p>
      {rs.length > 0 && (
        <>
          <p className="text-xs text-muted-foreground">{breakdown(rs)}</p>
          <p className="mt-2 text-sm text-amber-500">★ {average.toFixed(1)} promedio</p>
        </>
      )}
    </div>
  );
}

// wide: sin pareja las favoritas ocupan todo el ancho (6 en una fila en web);
// con pareja van de a 3, una columna para cada uno
function Favorites({ name, items, wide }: { name: string; items: RatedItem[]; wide: boolean }) {
  return (
    <section className="space-y-3">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">
        Favoritas de {name}
      </p>
      <div
        className={
          wide
            ? "grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4 lg:grid-cols-6 lg:gap-5"
            : "grid grid-cols-3 gap-3 sm:gap-4"
        }
      >
        {items.map((m, i) => (
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
  );
}

export default async function StatsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const myProfile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, user.id),
  });

  // Pareja = quien comparte al menos una lista contigo
  const [partnerUserId = null] = await getPartnerUserIds(user.id);

  const partnerProfile = partnerUserId
    ? await db.query.profiles.findFirst({
        where: eq(profiles.userId, partnerUserId),
      })
    : null;

  const ratingFields = {
    stars: ratings.stars,
    mediaItemId: ratings.mediaItemId,
    title: mediaItems.title,
    posterUrl: mediaItems.posterUrl,
    externalId: mediaItems.externalId,
    type: mediaItems.type,
    metadata: mediaItems.metadata,
  };

  // Películas y temporadas de series (los álbumes son otro mundo)
  function ratingsOf(userId: string) {
    return db
      .select(ratingFields)
      .from(ratings)
      .innerJoin(mediaItems, eq(ratings.mediaItemId, mediaItems.id))
      // Privacidad: de tu pareja solo cuenta lo que calificó de títulos en
      // listas que comparten (ver lib/visibility.ts). Lo tuyo cuenta todo.
      .where(
        and(
          eq(ratings.userId, userId),
          inArray(mediaItems.type, ["movie", "tv"]),
          ratingVisibleTo(user!.id)
        )
      )
      .orderBy(desc(ratings.updatedAt));
  }

  const [myRatings, partnerRatings] = await Promise.all([
    ratingsOf(user.id),
    partnerUserId ? ratingsOf(partnerUserId) : Promise.resolve([]),
  ]);

  // Lo que ambos calificaron
  const commonMovies = myRatings
    .filter((a) => partnerRatings.some((b) => b.mediaItemId === a.mediaItemId))
    .map((a) => {
      const b = partnerRatings.find((r) => r.mediaItemId === a.mediaItemId)!;
      return {
        mediaItemId: a.mediaItemId,
        title: a.title,
        posterUrl: a.posterUrl,
        externalId: a.externalId,
        type: a.type,
        metadata: a.metadata,
        myStars: a.stars,
        partnerStars: b.stars,
        diff: Math.abs(a.stars - b.stars),
      };
    });

  const mostControversial =
    [...commonMovies].sort((a, b) => b.diff - a.diff)[0] ?? null;

  const myAvg = avg(myRatings.map((r) => r.stars));
  const partnerAvg = avg(partnerRatings.map((r) => r.stars));

  const myFavorites = [...myRatings]
    .sort((a, b) => b.stars - a.stars)
    .slice(0, 6);
  const partnerFavorites = [...partnerRatings]
    .sort((a, b) => b.stars - a.stars)
    .slice(0, 6);

  const myName = myProfile?.displayName ?? myProfile?.username ?? "Tú";
  const partnerName =
    partnerProfile?.displayName ?? partnerProfile?.username ?? "";

  const controversialHref = mostControversial
    ? getMediaHref(mostControversial.type, mostControversial.externalId)
    : "";

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 space-y-8 p-4 sm:p-8 lg:max-w-6xl animate-in fade-in duration-300">
      <h1 className="text-2xl font-semibold">Estadísticas</h1>

      {/* Números: en web los tres en una fila */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <PersonStat label="Tú" name={myName} rs={myRatings} average={myAvg} />

        {partnerProfile ? (
          <PersonStat
            label="Tu pareja · en listas compartidas"
            name={partnerName}
            rs={partnerRatings}
            average={partnerAvg}
          />
        ) : (
          // Sin pareja ocupa el resto de la fila (no queda un hueco a la derecha)
          <div className="flex flex-col items-center justify-center border p-5 text-center lg:col-span-2">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Sin pareja aún</p>
            <p className="mt-3 max-w-sm text-sm text-muted-foreground">
              Invita a alguien a una lista para comparar estadísticas.
            </p>
          </div>
        )}

        {partnerProfile && (
          <div className="col-span-2 flex flex-col justify-center border p-5 text-center lg:col-span-1">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Vistas por los dos
            </p>
            <p className="mt-2 text-4xl font-bold tabular-nums lg:mt-4">{commonMovies.length}</p>
            <p className="text-xs text-muted-foreground">
              {commonMovies.length > 0
                ? `calificadas en común · ${breakdown(commonMovies)}`
                : "calificadas en común"}
            </p>
          </div>
        )}
      </div>

      {/* La más polémica */}
      {mostControversial && mostControversial.diff > 0 && (
        <section className="border p-5">
          <p className="mb-4 text-xs uppercase tracking-wider text-muted-foreground">
            La más polémica
          </p>
          <div className="flex items-start gap-5">
            {mostControversial.posterUrl && (
              <Link
                href={controversialHref}
                className="group relative aspect-[2/3] w-20 shrink-0 overflow-hidden bg-muted sm:w-24"
              >
                <Image
                  src={mostControversial.posterUrl}
                  alt={mostControversial.title}
                  fill
                  sizes="96px"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </Link>
            )}
            <div className="min-w-0 space-y-3">
              <Link href={controversialHref} className="block">
                <p className="text-lg font-semibold leading-snug hover:underline">
                  {mostControversial.title}
                  {getYear(mostControversial.metadata) && (
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                      {getYear(mostControversial.metadata)}
                    </span>
                  )}
                </p>
              </Link>
              <div className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-1 text-sm">
                <span className="text-muted-foreground">{myName}</span>
                <span className="text-amber-500">
                  {"★".repeat(mostControversial.myStars)}
                  {"☆".repeat(5 - mostControversial.myStars)}
                </span>
                <span className="text-muted-foreground">{partnerName}</span>
                <span className="text-amber-500">
                  {"★".repeat(mostControversial.partnerStars)}
                  {"☆".repeat(5 - mostControversial.partnerStars)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {mostControversial.diff}{" "}
                {mostControversial.diff === 1 ? "estrella" : "estrellas"} de diferencia
              </p>
            </div>
          </div>
        </section>
      )}

      {mostControversial && mostControversial.diff === 0 && (
        <div className="border p-5 text-center text-sm text-muted-foreground">
          Todo lo que calificaron en común tiene el mismo rating. ¡Qué sintonía!
        </div>
      )}

      {/* Favoritas: en web, una al lado de la otra */}
      {(myFavorites.length > 0 || partnerFavorites.length > 0) && (
        <div className={partnerProfile ? "grid gap-8 lg:grid-cols-2 lg:gap-12" : undefined}>
          {myFavorites.length > 0 && (
            <Favorites name={myName} items={myFavorites} wide={!partnerProfile} />
          )}
          {partnerProfile && partnerFavorites.length > 0 && (
            <Favorites name={partnerName} items={partnerFavorites} wide={false} />
          )}
        </div>
      )}

      {!partnerProfile && myRatings.length === 0 && (
        <p className="mt-12 text-center text-sm text-muted-foreground">
          Aún no has calificado nada.{" "}
          <Link href="/" className="text-amber-500 hover:underline">
            Busca una para empezar.
          </Link>
        </p>
      )}
    </main>
  );
}
