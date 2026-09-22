import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { sharedLists } from "@/lib/db/schema";
import { getListComparison } from "@/lib/list-compare";
import { createClient } from "@/lib/supabase/server";
import { getMediaHref } from "@/lib/media";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Comparar gustos entre los miembros de UNA lista, solo sobre sus títulos.
// Es la versión con sentido de las viejas "estadísticas de pareja": aquí
// está claro con quién comparas y sobre qué. Todo lo que se muestra ya era
// visible para los miembros (ver lib/visibility.ts).

function Stars({ value }: { value: number }) {
  const full = Math.round(value);
  return (
    <span className="whitespace-nowrap tracking-wider" aria-label={`${value.toFixed(1)} de 5 estrellas`}>
      <span className="text-amber-500">{"★".repeat(full)}</span>
      <span className="text-foreground/20">{"★".repeat(5 - full)}</span>
    </span>
  );
}

export default async function CompareListPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: listId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [list, comparison] = await Promise.all([
    db.query.sharedLists.findFirst({ where: eq(sharedLists.id, listId) }),
    getListComparison(listId),
  ]);
  const { members, items, rows, shared, agreements, mostDivisive, summaries } = comparison;
  // Solo miembros que aceptaron: los demás no saben que la lista existe
  if (!list || !members.some((m) => m.userId === user.id)) notFound();

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 space-y-8 p-4 sm:p-8 lg:max-w-6xl animate-in fade-in duration-300">
      <div className="space-y-2">
        <Link href={`/lists/${listId}`} className="text-xs text-muted-foreground hover:underline">
          ← {list.title}
        </Link>
        <h1 className="text-2xl font-semibold">Comparar gustos</h1>
        <p className="text-sm text-muted-foreground">Solo sobre los {items.length} títulos de esta lista.</p>
      </div>

      {/* Cada miembro: cuántos calificó y su promedio en esta lista */}
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {members.map((m) => {
          const { rated, average } = summaries.get(m.userId)!;
          return (
            <li key={m.userId} className="flex items-center gap-3 border p-4">
              <Avatar className="size-10">
                {m.avatarUrl && <AvatarImage src={m.avatarUrl} alt={`@${m.username}`} />}
                <AvatarFallback>{m.username.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 text-sm">
                <p className="truncate font-medium">
                  @{m.username}
                  {m.userId === user.id && <span className="font-normal text-muted-foreground"> (tú)</span>}
                </p>
                <p className="text-xs text-muted-foreground">
                  {rated}/{items.length} calificadas
                  {average !== null && <span className="text-amber-500"> · ★ {average.toFixed(1)}</span>}
                </p>
              </div>
            </li>
          );
        })}
      </ul>

      {shared.length === 0 ? (
        <p className="border p-5 text-sm text-muted-foreground">
          Todavía no hay títulos calificados por más de una persona. Cuando al menos dos califiquen el mismo, aquí verán en qué coinciden.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Coincidencia: misma nota (en series, promedios a menos de media estrella) */}
          <section className="space-y-3 border p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Coinciden</p>
            <p className="text-3xl font-bold tabular-nums">
              {agreements}
              <span className="text-lg font-normal text-muted-foreground"> de {shared.length}</span>
            </p>
            <div className="h-1.5 overflow-hidden bg-muted">
              <div className="h-full bg-amber-500" style={{ width: `${(agreements / shared.length) * 100}%` }} />
            </div>
            <p className="text-xs text-muted-foreground">Títulos calificados por dos o más, con la misma nota.</p>
          </section>

          <section className="space-y-3 border p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">La que más divide</p>
            {mostDivisive ? (
              <Link href={getMediaHref(mostDivisive.type, mostDivisive.externalId)} className="group flex gap-4">
                <div className="relative aspect-[2/3] w-14 shrink-0 overflow-hidden bg-muted">
                  {mostDivisive.posterUrl && (
                    <Image src={mostDivisive.posterUrl} alt="" fill sizes="56px" className="object-cover" />
                  )}
                </div>
                <div className="min-w-0 space-y-1.5 text-sm">
                  <p className="font-medium group-hover:underline">{mostDivisive.title}</p>
                  {members
                    .filter((m) => mostDivisive.byMember.has(m.userId))
                    .map((m) => (
                      <p key={m.userId} className="flex items-center gap-2 text-xs">
                        <span className="w-24 truncate text-muted-foreground">@{m.username}</span>
                        <Stars value={mostDivisive.byMember.get(m.userId)!} />
                      </p>
                    ))}
                </div>
              </Link>
            ) : (
              <p className="text-sm text-muted-foreground">
                Ninguna: en todo lo que calificaron juntos están de acuerdo. ¡Qué sintonía!
              </p>
            )}
          </section>
        </div>
      )}

      {/* Detalle por título: en móvil cada fila apila las notas debajo del título */}
      {items.length > 0 && (
        <section className="space-y-3">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Título por título</p>
          <ul className="divide-y border-y">
            {rows.map((r) => (
              <li key={r.mediaItemId} className="flex gap-3 py-3">
                <div className="relative aspect-[2/3] w-10 shrink-0 overflow-hidden bg-muted">
                  {r.posterUrl && <Image src={r.posterUrl} alt="" fill sizes="40px" className="object-cover" />}
                </div>
                <div className="min-w-0 flex-1 space-y-1.5">
                  <Link href={getMediaHref(r.type, r.externalId)} className="text-sm font-medium hover:underline">
                    {r.title}
                  </Link>
                  {r.byMember.size === 0 ? (
                    <p className="text-xs text-muted-foreground">Nadie la calificó todavía</p>
                  ) : (
                    <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs">
                      {members.map((m) => (
                        <span key={m.userId} className="flex items-center gap-1.5">
                          <span className="text-muted-foreground">@{m.username}</span>
                          {r.byMember.has(m.userId) ? (
                            <Stars value={r.byMember.get(m.userId)!} />
                          ) : (
                            <span className="text-foreground/30">—</span>
                          )}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {r.spread !== null && r.spread >= 1 && (
                  <span className="self-start whitespace-nowrap text-xs text-amber-500/90">
                    {r.spread.toFixed(r.spread % 1 ? 1 : 0)}★ de diferencia
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
