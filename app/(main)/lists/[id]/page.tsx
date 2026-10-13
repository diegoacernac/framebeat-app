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
import { ListAddPanel } from "@/components/lists/ListAddPanel";
import { ListSuggestions } from "@/components/lists/ListSuggestions";
import { ListItemRow } from "@/components/lists/ListItemRow";
import { DeleteListButton } from "@/components/lists/DeleteListButton";
import { RandomPickButton } from "@/components/lists/RandomPickButton";
import { CaretRightIcon, PlusIcon, ScalesIcon, UserPlusIcon } from "@phosphor-icons/react/dist/ssr";
import { ListHero } from "@/components/lists/ListHero";
import { Button } from "@/components/ui/button";
import { getMediaHref } from "@/lib/media";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SectionLabel, sectionLabelClass } from "@/components/ui/section-label";

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

  // Con la invitación pendiente todavía no se ve la lista
  const membership = await db.query.listMembers.findFirst({
    where: and(
      eq(listMembers.listId, listId),
      eq(listMembers.userId, user.id),
      eq(listMembers.status, "accepted")
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
      status: listMembers.status,
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

  // Miembros que aceptaron, el dueño primero (cabecera y "Comparar gustos")
  const acceptedMembers = members
    .filter((m) => m.status === "accepted")
    .sort((a, b) => (a.role === "owner" ? -1 : b.role === "owner" ? 1 : 0));

  // Privacidad: solo se muestran calificaciones de quienes ya aceptaron
  const memberUserIds = members.filter((m) => m.status === "accepted").map((m) => m.userId);
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
  const listAvgStars =
    allRatings.length > 0
      ? allRatings.reduce((sum, r) => sum + r.stars, 0) / allRatings.length
      : null;

  // "Vista" es por usuario: cada uno ve sus propias pendientes
  const userId = user.id;
  const pendingItems = items.filter((i) => !completedSet.has(i.mediaItemId));
  const watchedItems = items.filter((i) => completedSet.has(i.mediaItemId));

  function renderRow(item: (typeof items)[number], i: number) {
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
        index={i + 1}
      />
    );
  }

  return (
    // En web: la lista y sugerencias a la izquierda, añadir/miembros en una
    // columna lateral fija. En móvil todo va en una sola columna, en ese orden.
    <main className="mx-auto w-full max-w-4xl flex-1 space-y-8 p-4 sm:p-8 lg:max-w-6xl animate-in fade-in duration-300">
      <div>
        <ListHero
          backHref="/lists"
          title={list.title}
          description={list.description}
          posters={items.slice(0, 4).map((i) => i.posterUrl)}
          members={acceptedMembers}
          totalCount={totalCount}
          completedCount={completedCount}
          averageStars={listAvgStars}
        >
          {/* Barra de acciones: elegir al azar (principal) + secundarias */}
          <RandomPickButton
            candidates={pendingItems.map((i) => ({
              listItemId: i.listItemId,
              title: i.title,
              posterUrl: i.posterUrl,
              href: getMediaHref(i.mediaType, i.externalId),
            }))}
          >
            {/* Comparar gustos va en su propia vista; solo con 2+ miembros */}
            {acceptedMembers.length >= 2 && (
              <Button variant="outline" size="sm" asChild className="bg-background/40 backdrop-blur">
                <Link href={`/lists/${listId}/comparar`}>
                  <ScalesIcon size={14} /> Comparar gustos
                </Link>
              </Button>
            )}
            <Button variant="ghost" size="sm" asChild>
              <a href="#anadir">
                <PlusIcon size={14} /> Añadir
              </a>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <a href="#miembros">
                <UserPlusIcon size={14} /> Invitar
              </a>
            </Button>
          </RandomPickButton>
        </ListHero>
      </div>

      <div className="space-y-8 lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-12 lg:space-y-0">
      <div className="min-w-0 space-y-8">
      {/* Items — primary content */}
      {totalCount === 0 ? (
        <p className="py-4 text-sm text-muted-foreground">
          La lista está vacía. Añade películas o series abajo.
        </p>
      ) : (
        <>
          {/* Por ver — lo principal */}
          <section className="space-y-3">
            <SectionLabel as="h2">
              Por ver ({pendingItems.length})
            </SectionLabel>

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
              <summary className={`${sectionLabelClass} flex cursor-pointer list-none items-center gap-1.5 transition-colors hover:text-foreground [&::-webkit-details-marker]:hidden`}>
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
      <aside className="space-y-4 lg:sticky lg:top-6 lg:max-h-[calc(100dvh-3rem)] lg:overflow-y-auto lg:pr-1">
      <section id="anadir" className="scroll-mt-24">
        <ListAddPanel listId={listId} existingKeys={existingKeys} />
      </section>

      <section id="miembros" className="scroll-mt-24 space-y-4 border bg-card p-4">
        <SectionLabel as="h2">Miembros · {acceptedMembers.length}</SectionLabel>
        <ul className="space-y-2.5">
          {members.map((m) => (
            <li key={m.userId} className="flex items-center gap-3 text-sm">
              <Avatar className="size-8">
                {m.avatarUrl && <AvatarImage src={m.avatarUrl} alt={m.username} />}
                <AvatarFallback className="text-xs">{m.username.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              {/* Pendiente: aún no comparten la lista, su perfil no es visible */}
              {m.status === "accepted" ? (
                <Link href={`/u/${m.username}`} className="min-w-0 flex-1 truncate hover:underline">
                  @{m.username}
                  {m.userId === userId && <span className="text-muted-foreground"> (tú)</span>}
                </Link>
              ) : (
                <span className="min-w-0 flex-1 truncate text-muted-foreground">@{m.username}</span>
              )}
              {m.role === "owner" && (
                <span className="shrink-0 border px-1.5 py-0.5 text-[11px] text-muted-foreground">Dueño</span>
              )}
              {m.status === "pending" && (
                <span className="shrink-0 border border-primary/40 px-1.5 py-0.5 text-[11px] text-primary">Pendiente</span>
              )}
            </li>
          ))}
        </ul>
        <InviteMemberForm listId={listId} />
      </section>

      {membership.role === "owner" && (
        <div className="flex justify-end px-1 pt-1">
          <DeleteListButton listId={listId} title={list.title} />
        </div>
      )}
      </aside>
      </div>
    </main>
  );
}
