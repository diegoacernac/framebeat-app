import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { listItemProgress, listItems, listMembers, mediaItems, sharedLists } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

export default async function ListsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const lists = await db
    .select({
      id: sharedLists.id,
      title: sharedLists.title,
      description: sharedLists.description,
      role: listMembers.role,
      createdAt: sharedLists.createdAt,
    })
    .from(listMembers)
    .innerJoin(sharedLists, eq(listMembers.listId, sharedLists.id))
    .where(eq(listMembers.userId, user.id));

  const listIds = lists.map((l) => l.id);

  const allItems = listIds.length
    ? await db
        .select({
          listId: listItems.listId,
          mediaItemId: mediaItems.id,
          posterUrl: mediaItems.posterUrl,
        })
        .from(listItems)
        .innerJoin(mediaItems, eq(listItems.mediaItemId, mediaItems.id))
        .where(inArray(listItems.listId, listIds))
        .orderBy(listItems.position)
    : [];

  const allProgress = listIds.length
    ? await db
        .select({ listId: listItemProgress.listId, mediaItemId: listItemProgress.mediaItemId })
        .from(listItemProgress)
        .where(
          and(
            inArray(listItemProgress.listId, listIds),
            eq(listItemProgress.userId, user.id)
          )
        )
    : [];

  const itemsByList = allItems.reduce<Record<string, typeof allItems>>((acc, item) => {
    (acc[item.listId] ??= []).push(item);
    return acc;
  }, {});

  const completedByList = allProgress.reduce<Record<string, Set<string>>>((acc, p) => {
    (acc[p.listId] ??= new Set()).add(p.mediaItemId);
    return acc;
  }, {});

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 space-y-6 p-4 sm:p-8 lg:max-w-6xl animate-in fade-in duration-300">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Mis listas</h1>
        <Button asChild>
          <Link href="/lists/new">Nueva lista</Link>
        </Button>
      </div>

      {lists.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aún no tienes listas compartidas.
        </p>
      ) : (
        // Tarjetas en grilla: 1 columna en móvil, 2 en tablet, 3 en web
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {lists.map((list, i) => {
            const items = itemsByList[list.id] ?? [];
            const completed = completedByList[list.id] ?? new Set();
            const total = items.length;
            const completedCount = completed.size;
            const pct = total > 0 ? (completedCount / total) * 100 : 0;
            const roleLabel = list.role === "owner" ? "Propietario" : "Miembro";

            return (
              <li
                key={list.id}
                // Entrada escalonada, igual que los pósters del buscador y el feed
                className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-300"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <Link
                  href={`/lists/${list.id}`}
                  className="group flex h-full flex-col gap-4 border p-4 transition-colors hover:border-foreground/30 hover:bg-muted/20 active:bg-muted/40"
                >
                  <PosterStrip posters={items.map((item) => item.posterUrl)} total={total} />

                  <div className="flex-1">
                    <p className="font-medium leading-snug">{list.title}</p>
                    {list.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {list.description}
                      </p>
                    )}
                  </div>

                  {total > 0 ? (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          <span className="font-medium text-foreground">{completedCount}</span>
                          /{total} vistas
                        </span>
                        <span>{roleLabel}</span>
                      </div>
                      <div className="h-0.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full bg-amber-500 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">{roleLabel} · sin contenido aún</p>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}

// Los primeros 5 pósters a todo el ancho de la tarjeta. Si hay más, el
// último muestra "+N"; si hay menos (o ninguno), los huecos quedan vacíos
// para que todas las tarjetas tengan la misma altura.
const STRIP_SIZE = 5;

function PosterStrip({ posters, total }: { posters: (string | null)[]; total: number }) {
  return (
    <div className="grid grid-cols-5 gap-1">
      {Array.from({ length: STRIP_SIZE }, (_, i) => {
        const poster = posters[i];
        const isLast = i === STRIP_SIZE - 1;
        const hidden = total - STRIP_SIZE + 1; // los que no se ven, contando este
        return (
          <div key={i} className="relative aspect-[2/3] overflow-hidden bg-muted/60">
            {poster && (
              <Image
                src={poster}
                alt=""
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(min-width: 1024px) 70px, (min-width: 640px) 18vw, 18vw"
              />
            )}
            {isLast && total > STRIP_SIZE && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/65">
                <span className="text-sm font-medium text-white">+{hidden}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
