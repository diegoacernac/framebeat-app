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
  
  const progressRow = mediaItemIds.length
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
  
  const completedSet = new Set(progressRow.map((p) => p.mediaItemId));

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 space-y-8 p-8 animate-in fade-in duration-300">
      <div className="space-y-2">
        <Link href="/lists" className="text-xs text-muted-foreground hover:underline">
          ← Mis listas
        </Link>
        <h1 className="text-2xl font-semibold">{list.title}</h1>
        {list.description && (
          <p className="text-sm text-muted-foreground">{list.description}</p>
        )}
      </div>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Miembros</h2>
        <ul className="flex flex-wrap gap-3">
          {members.map((m) => (
            <li key={m.userId} className="flex items-center gap-2 text-sm">
              <Avatar className="size-8">
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
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Añadir película</h2>
        <ListAddMovieSearch listId={listId} />
      </section>
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Ítems ({items.length})</h2>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            La lista está vacía. Busca películas arriba.
          </p>
        ) : (
          items.map((item) => {
            const itemRatings = allRatings.filter(
              (r) => r.mediaItemId === item.mediaItemId
            );
            const averageStars =
              itemRatings.length > 0
                ? itemRatings.reduce((sum, r) => sum + r.stars, 0) /
                  itemRatings.length
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
          })
        )}
      </section>
    </main>
  );
}