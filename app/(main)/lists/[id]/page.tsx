import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { and, asc, eq, inArray } from "drizzle-orm";
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
import { ListSuggestions } from "@/components/lists/ListSuggestions";
import { ListItemRow } from "@/components/lists/ListItemRow";
import { DeleteListButton } from "@/components/lists/DeleteListButton";
import { RandomPickButton } from "@/components/lists/RandomPickButton";
import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr";
import { getMediaHref } from "@/lib/media";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// metadata.year lo guardan todos los botones de añadir ("2014")
function getYear(metadata: unknown) {
  const year = Number((metadata as { year?: unknown } | null)?.year);
  return Number.isFinite(year) && year > 0 ? year : null;
}

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
      metadata: mediaItems.metadata,
    })
    .from(listItems)
    .innerJoin(mediaItems, eq(listItems.mediaItemId, mediaItems.id))
    .where(eq(listItems.listId, listId))
    // Orden estable: sin orderBy, Postgres puede devolverlos en cualquier orden
    .orderBy(asc(listItems.createdAt))
    // Por año de estreno (una saga queda en orden); sin año, al final en el
    // orden en que se añadieron (sort es estable)
    .then((rows) =>
      rows
        .map((row) => ({ ...row, year: getYear(row.metadata) }))
        .sort((a, b) => (a.year ?? 9999) - (b.year ?? 9999))
    );

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

  // "movie:123": para marcar ✓ lo que ya está en los buscadores y sugerencias
  const existingKeys = items.map((i) => `${i.mediaType}:${i.externalId}`);

  const completedSet = new Set(progressRows.map((p) => p.mediaItemId));
  const completedCount = completedSet.size;
  const totalCount = items.length;
  const progressPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const listAvgStars =
    allRatings.length > 0
      ? allRatings.reduce((sum, r) => sum + r.stars, 0) / allRatings.length
      : null;

  // "Vista" es por usuario: cada uno ve sus propias pendientes
  const userId = user.id;
  const pendingItems = items.filter((i) => !completedSet.has(i.mediaItemId));
  const watchedItems = items.filter((i) => completedSet.has(i.mediaItemId));

  function renderRow(item: (typeof items)[number]) {
    const itemRatings = allRatings.filter((r) => r.mediaItemId === item.mediaItemId);
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
        year={item.year}
        posterUrl={item.posterUrl}
        mediaType={item.mediaType}
        externalId={item.externalId}
        averageStars={averageStars}
        memberRatings={itemRatings}
        completed={completedSet.has(item.mediaItemId)}
        currentUserId={userId}
      />
    );
  }

  return (
    // En web: la lista y sugerencias a la izquierda, añadir/miembros en una
    // columna lateral fija. En móvil todo va en una sola columna, en ese orden.
    <main className="mx-auto w-full max-w-4xl flex-1 space-y-8 p-4 sm:p-8 lg:max-w-6xl animate-in fade-in duration-300">
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

      <div className="space-y-8 lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-12 lg:space-y-0">
      <div className="min-w-0 space-y-8">
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
      {totalCount === 0 ? (
        <p className="py-4 text-sm text-muted-foreground">
          La lista está vacía. Añade películas o series abajo.
        </p>
      ) : (
        <>
          {/* Por ver — lo principal */}
          <section className="space-y-3">
            <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Por ver ({pendingItems.length})
            </h2>

            {pendingItems.length >= 2 && (
              <RandomPickButton
                candidates={pendingItems.map((i) => ({
                  listItemId: i.listItemId,
                  title: i.title,
                  posterUrl: i.posterUrl,
                  href: getMediaHref(i.mediaType, i.externalId),
                }))}
              />
            )}

            {pendingItems.length === 0 ? (
              <p className="py-2 text-sm text-muted-foreground animate-in fade-in duration-300">
                ¡Ya viste todo! Añade más abajo.
              </p>
            ) : (
              <div>{pendingItems.map(renderRow)}</div>
            )}
          </section>

          {/* Vistas — plegadas para no estorbar */}
          {watchedItems.length > 0 && (
            <details className="group" open={pendingItems.length === 0}>
              <summary className="flex cursor-pointer list-none items-center gap-1.5 text-sm font-medium uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground [&::-webkit-details-marker]:hidden">
                <CaretRightIcon
                  size={12}
                  weight="bold"
                  className="transition-transform duration-200 group-open:rotate-90"
                />
                Vistas ({watchedItems.length})
              </summary>
              <div className="mt-1">{watchedItems.map(renderRow)}</div>
            </details>
          )}
        </>
      )}

      {/* Según el título, la descripción y lo que ya tienen */}
      <div className="border-t pt-6">
        <ListSuggestions listId={listId} existingKeys={existingKeys} />
      </div>
      </div>

      {/* Management — secondary (en web: columna lateral fija) */}
      <aside className="space-y-8 lg:sticky lg:top-6 lg:max-h-[calc(100dvh-3rem)] lg:overflow-y-auto lg:pr-1">
      <section className="space-y-3 border-t pt-6 lg:border-t-0 lg:pt-0">
        <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Añadir película
        </h2>
        <ListAddMovieSearch listId={listId} kind="movie" existingKeys={existingKeys} />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Añadir serie
        </h2>
        <ListAddMovieSearch listId={listId} kind="tv" existingKeys={existingKeys} />
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

      {membership.role === "owner" && (
        <section className="space-y-3 border-t pt-6">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Zona de peligro
          </h2>
          <DeleteListButton listId={listId} title={list.title} />
        </section>
      )}
      </aside>
      </div>
    </main>
  );
}
