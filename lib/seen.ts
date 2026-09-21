import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { listItemProgress, mediaItems, ratings } from "@/lib/db/schema";

// IDs de TMDB de lo que alguno de estos usuarios ya vio: lo calificó, o lo
// marcó como visto en alguna lista.
// - Películas: el externalId ya es el id de TMDB.
// - Series: se califican por temporada ("1396-s2"), así que calificar
//   cualquier temporada cuenta como "ya la vieron" → nos quedamos con "1396".
// (Archivo aparte de lib/discover.ts porque ese lo importa un componente
// cliente, y esto usa la base de datos: solo puede correr en el servidor.)
export async function getSeenIds(userIds: string[], kind: "movie" | "tv") {
  if (userIds.length === 0) return new Set<string>();

  const [rated, marked] = await Promise.all([
    db
      .select({ externalId: mediaItems.externalId })
      .from(ratings)
      .innerJoin(mediaItems, eq(ratings.mediaItemId, mediaItems.id))
      .where(and(inArray(ratings.userId, userIds), eq(mediaItems.type, kind))),
    db
      .select({ externalId: mediaItems.externalId })
      .from(listItemProgress)
      .innerJoin(mediaItems, eq(listItemProgress.mediaItemId, mediaItems.id))
      .where(and(inArray(listItemProgress.userId, userIds), eq(mediaItems.type, kind))),
  ]);

  return new Set(
    [...rated, ...marked].map((r) => r.externalId.replace(/-s\d+$/, ""))
  );
}
