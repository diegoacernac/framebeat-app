import { and, desc, eq, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { mediaItems, profiles, ratings } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import { getPartnerUserIds } from "@/lib/lists";
import { getMediaHref } from "@/lib/media";

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
  };

  // Películas y temporadas de series (los álbumes son otro mundo)
  function ratingsOf(userId: string) {
    return db
      .select(ratingFields)
      .from(ratings)
      .innerJoin(mediaItems, eq(ratings.mediaItemId, mediaItems.id))
      .where(and(eq(ratings.userId, userId), inArray(mediaItems.type, ["movie", "tv"])))
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

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 p-4 sm:p-8">
      <h1 className="mb-8 text-2xl font-semibold">Estadísticas</h1>

      {/* Stat cards */}
      <div className="mb-4 grid grid-cols-2 gap-4">
        <div className="rounded-lg border bg-card p-5 text-center">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Tú
          </p>
          <p className="mt-1 font-semibold">{myName}</p>
          <p className="mt-4 text-4xl font-bold text-amber-500">
            {myRatings.length}
          </p>
          <p className="text-xs text-muted-foreground">calificadas</p>
          {myRatings.length > 0 && (
            <p className="text-xs text-muted-foreground">{breakdown(myRatings)}</p>
          )}
          {myRatings.length > 0 && (
            <p className="mt-2 text-sm text-amber-500">
              ★ {myAvg.toFixed(1)} promedio
            </p>
          )}
        </div>

        <div className="rounded-lg border bg-card p-5 text-center">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            {partnerProfile ? "Tu pareja" : "Sin pareja aún"}
          </p>
          <p className="mt-1 font-semibold">{partnerName}</p>
          {partnerProfile ? (
            <>
              <p className="mt-4 text-4xl font-bold text-amber-500">
                {partnerRatings.length}
              </p>
              <p className="text-xs text-muted-foreground">calificadas</p>
              {partnerRatings.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {breakdown(partnerRatings)}
                </p>
              )}
              {partnerRatings.length > 0 && (
                <p className="mt-2 text-sm text-amber-500">
                  ★ {partnerAvg.toFixed(1)} promedio
                </p>
              )}
            </>
          ) : (
            <p className="mt-6 text-sm text-muted-foreground">
              Invita a alguien a una lista para comparar estadísticas.
            </p>
          )}
        </div>
      </div>

      {/* Movies in common */}
      {partnerProfile && (
        <div className="mb-8 rounded-lg border bg-card p-5 text-center">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Vistas por los dos
          </p>
          <p className="mt-2 text-4xl font-bold">{commonMovies.length}</p>
          <p className="text-xs text-muted-foreground">
            {commonMovies.length > 0
              ? `calificadas en común · ${breakdown(commonMovies)}`
              : "calificadas en común"}
          </p>
        </div>
      )}

      {/* Most controversial */}
      {mostControversial && mostControversial.diff > 0 && (
        <div className="mb-8 rounded-lg border bg-card p-5">
          <p className="mb-4 text-xs uppercase tracking-wider text-muted-foreground">
            La más polémica
          </p>
          <div className="flex items-start gap-4">
            {mostControversial.posterUrl && (
              <Link href={getMediaHref(mostControversial.type, mostControversial.externalId)}>
                <img
                  src={mostControversial.posterUrl}
                  alt={mostControversial.title}
                  className="w-14 shrink-0 self-start rounded-sm object-cover"
                />
              </Link>
            )}
            <div>
              <Link href={getMediaHref(mostControversial.type, mostControversial.externalId)}>
                <p className="font-semibold hover:underline">
                  {mostControversial.title}
                </p>
              </Link>
              <p className="mt-2 text-sm">
                <span className="text-muted-foreground">{myName}: </span>
                <span className="text-amber-500">
                  {"★".repeat(mostControversial.myStars)}
                  {"☆".repeat(5 - mostControversial.myStars)}
                </span>
              </p>
              <p className="text-sm">
                <span className="text-muted-foreground">{partnerName}: </span>
                <span className="text-amber-500">
                  {"★".repeat(mostControversial.partnerStars)}
                  {"☆".repeat(5 - mostControversial.partnerStars)}
                </span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {mostControversial.diff}{" "}
                {mostControversial.diff === 1 ? "estrella" : "estrellas"} de
                diferencia
              </p>
            </div>
          </div>
        </div>
      )}

      {mostControversial && mostControversial.diff === 0 && (
        <div className="mb-8 rounded-lg border bg-card p-5 text-center text-sm text-muted-foreground">
          Todo lo que calificaron en común tiene el mismo rating. ¡Qué sintonía!
        </div>
      )}

      {/* Favorites per user */}
      {partnerProfile && (myFavorites.length > 0 || partnerFavorites.length > 0) && (
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="mb-3 text-xs uppercase tracking-wider text-muted-foreground">
              Favoritas de {myName}
            </p>
            <div className="space-y-2">
              {myFavorites.map((m) => (
                <Link
                  key={m.mediaItemId}
                  href={getMediaHref(m.type, m.externalId)}
                  className="-mx-1 flex items-center gap-3 rounded p-1 hover:bg-muted/50"
                >
                  {m.posterUrl && (
                    <img
                      src={m.posterUrl}
                      alt={m.title}
                      className="w-8 shrink-0 self-start rounded-sm object-cover"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{m.title}</p>
                    <p className="text-xs text-amber-500">
                      {"★".repeat(m.stars)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-3 text-xs uppercase tracking-wider text-muted-foreground">
              Favoritas de {partnerName}
            </p>
            <div className="space-y-2">
              {partnerFavorites.map((m) => (
                <Link
                  key={m.mediaItemId}
                  href={getMediaHref(m.type, m.externalId)}
                  className="-mx-1 flex items-center gap-3 rounded p-1 hover:bg-muted/50"
                >
                  {m.posterUrl && (
                    <img
                      src={m.posterUrl}
                      alt={m.title}
                      className="w-8 shrink-0 self-start rounded-sm object-cover"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{m.title}</p>
                    <p className="text-xs text-amber-500">
                      {"★".repeat(m.stars)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
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
