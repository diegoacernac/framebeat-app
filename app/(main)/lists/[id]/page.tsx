import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "../../../../lib/db";
import {
  listItemProgress,
  listItems,
  listMembers,
  mediaItems,
  profiles,
  ratings,
  sharedLists,
} from "@/lib/db/schema";
import { createClient } from "../../../../lib/supabase/server";
import { InviteMemberForm } from "@/components/lists/InviteMemberForm";
import { ListAddMovieSearch } from "@/components/lists/ListAddMovieSearch";
import { ListItemRow } from "@/components/lists/ListItemRow";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default async function ListDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: listId } = await params;
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const membership = await db.query.listMembers.findFirst({
    where: and(
      eq(listMembers.listId, listId),
      eq(listMembers.userId, user.id)
    ),
  });
  if (!membership) notFound();

  const list = await db.query.sharedLists.findFirst({
    where: eq(sharedLists.id, listId),
  });
  if (!list) notFound();

  const members = await db
    .select({
      userId: listMembers.userId,
      role: listMembers.role,
      username: profiles.username,
      avatarUrl: profiles.avatarUrl,
    })
    .from(listMembers)
    .innerJoin(profiles, eq(listMembers.userId, profiles.userId))
    .where(eq(listMembers.listId, listId));

  const items = await db
    .select({
      listItemId: listItems.id,
      mediaItemId: mediaItems.id,
      title: mediaItems.title,
      posterUrl: mediaItems.posterUrl,
      mediaType: mediaItems.type,
      externalId: mediaItems.externalId,
      position: listItems.position,
    })
    .from(listItems)
    .innerJoin(mediaItems, eq(listItems.mediaItemId, mediaItems.id))
    .where(eq(listItems.listId, listId));

  const memberUserIds = members.map((m) => m.userId);
  const mediaItemIds = items.map((i) => i.mediaItemId);

  const allRatings = mediaItemIds.length && memberUserIds.length
    ? await db
      .select({
        mediaItemId: ratings.mediaItemId,
        userId: ratings.userId,
        stars: ratings.stars,
        review: ratings.review,
        username: profiles.username,
      })
      .from(ratings)
      .innerJoin(profiles, eq(ratings.userId, profiles.userId))
      .where(
        and(
          inArray(ratings.mediaItemId, mediaItemIds),
          inArray(ratings.userId, memberUserIds)
        )
      )
    : [];

  const progressRows = mediaItemIds.length
    ? await db
      .select()
      .from(listItemProgress)
      .where(
        and(
          eq(listItemProgress.listId, listId),
          eq(listItemProgress.userId, user.id),
          inArray(listItemProgress.mediaItemId, mediaItemIds)
        )
      )
    : [];

  const completedSet = new Set(progressRows.map((p) => p.mediaItemId));
  const completedCount = completedSet.size;
  const totalCount = items.length;
  const progressPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const listAvgStars =
    allRatings.length > 0
      ? allRatings.reduce((sum, r) => sum + r.stars, 0) / allRatings.length
      : null;

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 space-y-8 p-4 sm:p-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="space-y-2">
        <Link href="/lists" className="text-xs text-muted-foreground hover:underline">
          ← Mis listas
        </Link>
        <h1 className="text-2xl font-semibold">{list.title}</h1>
        {list.description && (
          <p className="text-sm text-muted-foreground">{list.description}</p>
        )}
      </div>

      {/* Progress stats */}
      {totalCount > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              <span className="font-medium text-foreground">{completedCount}</span>
              /{totalCount} vistas
            </span>
            {listAvgStars !== null && (
              <span className="text-amber-500 font-medium">
                ★ {listAvgStars.toFixed(1)}
                <span className="text-muted-foreground font-normal text-xs"> promedio</span>
              </span>
            )}
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-amber-500 transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Items — primary content */}
      <section className="space-y-1">
        <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Contenido ({totalCount})
        </h2>
        {totalCount === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">
            La lista está vacía. Añade películas o series abajo.
          </p>
        ) : (
          <div>
            {items.map((item) => {
              const itemRatings = allRatings.filter(
                (r) => r.mediaItemId === item.mediaItemId
              );
              const averageStars =
                itemRatings.length > 0
                  ? itemRatings.reduce((sum, r) => sum + r.stars, 0) / itemRatings.length
                  : null;
              return (
                <ListItemRow
                  key={item.listItemId}
                  listId={listId}
                  listItemId={item.listItemId}
                  mediaItemId={item.mediaItemId}
                  title={item.title}
                  posterUrl={item.posterUrl}
                  mediaType={item.mediaType}
                  externalId={item.externalId}
                  averageStars={averageStars}
                  memberRatings={itemRatings}
                  completed={completedSet.has(item.mediaItemId)}
                  currentUserId={user.id}
                />
              );
            })}
          </div>
        )}
      </section>

      {/* Management — secondary */}
      <section className="space-y-3 border-t pt-6">
        <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Añadir película
        </h2>
        <ListAddMovieSearch listId={listId} kind="movie" />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Añadir serie
        </h2>
        <ListAddMovieSearch listId={listId} kind="tv" />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Miembros
        </h2>
        <ul className="flex flex-wrap gap-3">
          {members.map((m) => (
            <li key={m.userId} className="flex items-center gap-2 text-sm">
              <Avatar className="size-7">
                {m.avatarUrl && <AvatarImage src={m.avatarUrl} alt={m.username} />}
                <AvatarFallback>{m.username.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <Link href={`/u/${m.username}`} className="hover:underline">
                @{m.username}
              </Link>
              {m.role === "owner" && (
                <span className="text-xs text-muted-foreground">(owner)</span>
              )}
            </li>
          ))}
        </ul>
        <InviteMemberForm listId={listId} />
      </section>
    </main>
  );
}
