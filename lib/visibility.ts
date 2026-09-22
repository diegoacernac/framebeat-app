import { eq, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { ratings } from "@/lib/db/schema";

// Privacidad de calificaciones y reseñas. La regla, en un solo lugar:
//
//   Veo una calificación si es mía, o si su autor y yo estamos en una misma
//   lista que contiene ese título (los dos con la invitación aceptada).
//
// Ejemplo: A califica Interestelar con 5. B solo lo ve si Interestelar está
// en una lista donde están A y B. Si B no está en "Nolan", no sabe nada.
//
// Series: en las listas se guarda la serie completa ("tv", "1399"), pero se
// califica por temporada ("1399-s2"). Una temporada cuenta como "en la lista"
// si la serie lo está.
//
// Sin sesión no se ve ninguna calificación ajena.
//
// Se usa como condición WHERE en consultas que lean la tabla `ratings`
// (sin alias).
export function ratingVisibleTo(viewerId: string | null | undefined): SQL {
  if (!viewerId) return sql`false`;

  return or(
    eq(ratings.userId, viewerId),
    sql`exists (
      select 1
      from list_items li
      join list_members viewer on viewer.list_id = li.list_id and viewer.user_id = ${viewerId}
        and viewer.status = 'accepted'
      join list_members author on author.list_id = li.list_id and author.user_id = ${ratings.userId}
        and author.status = 'accepted'
      join media_items listed on listed.id = li.media_item_id
      join media_items rated on rated.id = ${ratings.mediaItemId}
      where listed.id = rated.id
         or (rated.type = 'tv' and listed.type = 'tv'
             and rated.external_id like listed.external_id || '-s%')
    )`
  )!;
}

// ¿Comparten al menos una lista? Sin esto, el perfil de otra persona no
// existe para ti (ni siquiera su nombre).
export async function sharesAnyList(userA: string, userB: string) {
  if (userA === userB) return true;
  const rows = await db.execute(sql`
    select 1
    from list_members a
    join list_members b on b.list_id = a.list_id
    where a.user_id = ${userA} and b.user_id = ${userB}
      and a.status = 'accepted' and b.status = 'accepted'
    limit 1
  `);
  return rows.length > 0;
}
