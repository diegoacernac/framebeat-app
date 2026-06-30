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
    <main className="mx-auto w-full max-w-2xl flex-1 space-y-6 p-4 sm:p-8 animate-in fade-in duration-300">
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
        <ul className="space-y-3">
          {lists.map((list) => {
            const items = itemsByList[list.id] ?? [];
            const completed = completedByList[list.id] ?? new Set();
            const total = items.length;
            const completedCount = completed.size;
            const pct = total > 0 ? (completedCount / total) * 100 : 0;
            const previews = items.slice(0, 5);

            return (
              <li key={list.id}>
                <Link
                  href={`/lists/${list.id}`}
                  className="block border p-4 space-y-3 transition-colors hover:bg-muted/30"
                >
                  {previews.length > 0 && (
                    <div className="flex gap-1">
                      {previews.map((item, i) => (
                        <div
                          key={i}
                          className="relative w-10 shrink-0 overflow-hidden bg-muted aspect-[2/3]"
                        >
                          {item.posterUrl && (
                            <Image
                              src={item.posterUrl}
                              alt=""
                              fill
                              className="object-cover"
                              sizes="40px"
                            />
                          )}
                        </div>
                      ))}
                      {total > 5 && (
                        <div className="relative w-10 shrink-0 aspect-[2/3] bg-muted flex items-center justify-center">
                          <span className="text-xs text-muted-foreground">+{total - 5}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <p className="font-medium">{list.title}</p>
                    {list.description && (
                      <p className="mt-0.5 text-sm text-muted-foreground">{list.description}</p>
                    )}
                  </div>

                  {total > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          <span className="font-medium text-foreground">{completedCount}</span>
                          /{total} vistas
                        </span>
                        <span>{list.role === "owner" ? "Propietario" : "Miembro"}</span>
                      </div>
                      <div className="h-0.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full bg-amber-500 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {total === 0 && (
                    <p className="text-xs text-muted-foreground">
                      {list.role === "owner" ? "Propietario" : "Miembro"} · sin contenido aún
                    </p>
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
