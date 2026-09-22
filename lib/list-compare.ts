import { and, eq, inArray, like, or } from "drizzle-orm";
import { db as defaultDb } from "@/lib/db";
import { listItems, listMembers, mediaItems, profiles, ratings } from "@/lib/db/schema";

// Datos de "Comparar gustos" de una lista: miembros que aceptaron, y para
// cada título de la lista la nota de cada uno. Solo títulos de la lista, así
// que todo ya era visible entre los miembros (ver lib/visibility.ts).
// Series: se califican por temporada ("1399-s2"); cuenta el promedio de las
// temporadas que calificó cada uno.
export async function getListComparison(listId: string, db = defaultDb) {
  const [members, items] = await Promise.all([
    db
      .select({ userId: listMembers.userId, username: profiles.username, avatarUrl: profiles.avatarUrl })
      .from(listMembers)
      .innerJoin(profiles, eq(listMembers.userId, profiles.userId))
      .where(and(eq(listMembers.listId, listId), eq(listMembers.status, "accepted"))),
    db
      .select({
        mediaItemId: mediaItems.id,
        type: mediaItems.type,
        externalId: mediaItems.externalId,
        title: mediaItems.title,
        posterUrl: mediaItems.posterUrl,
      })
      .from(listItems)
      .innerJoin(mediaItems, eq(listItems.mediaItemId, mediaItems.id))
      .where(eq(listItems.listId, listId)),
  ]);

  const movieIds = items.filter((i) => i.type !== "tv").map((i) => i.mediaItemId);
  const seriesIds = items.filter((i) => i.type === "tv").map((i) => i.externalId);
  const titleConditions = [
    ...(movieIds.length ? [inArray(ratings.mediaItemId, movieIds)] : []),
    ...seriesIds.map((id) => and(eq(mediaItems.type, "tv"), like(mediaItems.externalId, `${id}-s%`))),
  ];
  const memberRatings =
    titleConditions.length && members.length
      ? await db
          .select({
            userId: ratings.userId,
            stars: ratings.stars,
            mediaItemId: ratings.mediaItemId,
            type: mediaItems.type,
            externalId: mediaItems.externalId,
          })
          .from(ratings)
          .innerJoin(mediaItems, eq(ratings.mediaItemId, mediaItems.id))
          .where(and(inArray(ratings.userId, members.map((m) => m.userId)), or(...titleConditions)))
      : [];

  const rows = items
    .map((item) => {
      const byMember = new Map<string, number>();
      for (const m of members) {
        const own = memberRatings.filter(
          (r) =>
            r.userId === m.userId &&
            (item.type === "tv"
              ? r.type === "tv" && r.externalId.startsWith(`${item.externalId}-s`)
              : r.mediaItemId === item.mediaItemId)
        );
        if (own.length) byMember.set(m.userId, own.reduce((s, r) => s + r.stars, 0) / own.length);
      }
      const values = [...byMember.values()];
      const spread = values.length >= 2 ? Math.max(...values) - Math.min(...values) : null;
      return { ...item, byMember, spread };
    })
    // Primero lo que más divide; después lo calificado por uno solo; al final lo que nadie calificó
    .sort((a, b) => (b.spread ?? -1) - (a.spread ?? -1) || b.byMember.size - a.byMember.size);

  const shared = rows.filter((r) => r.spread !== null);
  // Coinciden: misma nota (en series, promedios a menos de media estrella)
  const agreements = shared.filter((r) => r.spread! < 0.5).length;
  const mostDivisive = shared[0] && shared[0].spread! >= 1 ? shared[0] : null;

  const summaries = new Map(
    members.map((m) => {
      const mine = rows.filter((r) => r.byMember.has(m.userId)).map((r) => r.byMember.get(m.userId)!);
      return [
        m.userId,
        { rated: mine.length, average: mine.length ? mine.reduce((s, v) => s + v, 0) / mine.length : null },
      ] as const;
    })
  );

  return { members, items, rows, shared, agreements, mostDivisive, summaries };
}
