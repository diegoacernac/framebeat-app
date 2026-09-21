import { and, desc, eq, inArray, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { listItems, listMembers, mediaItems, sharedLists } from "./db/schema";
import type { MediaType } from "./media";

// Quienes comparten al menos una lista con el usuario (su pareja, en la práctica)
export async function getPartnerUserIds(userId: string) {
  const myLists = db
    .select({ listId: listMembers.listId })
    .from(listMembers)
    .where(eq(listMembers.userId, userId));

  const others = await db
    .selectDistinct({ userId: listMembers.userId })
    .from(listMembers)
    .where(and(inArray(listMembers.listId, myLists), ne(listMembers.userId, userId)));

  return others.map((o) => o.userId);
}

// Las listas del usuario y, para cada una, si ya contiene este título
// (listItemId) o no (null). Lo usa el botón "Añadir a lista" de las fichas.
export async function getUserListsWithMedia(
  userId: string,
  mediaType: MediaType,
  externalId: string
) {
  const [lists, mediaItem] = await Promise.all([
    db
      .select({ id: sharedLists.id, title: sharedLists.title })
      .from(listMembers)
      .innerJoin(sharedLists, eq(listMembers.listId, sharedLists.id))
      .where(eq(listMembers.userId, userId))
      .orderBy(desc(sharedLists.createdAt)),
    db.query.mediaItems.findFirst({
      where: and(eq(mediaItems.type, mediaType), eq(mediaItems.externalId, externalId)),
    }),
  ]);

  // Si el título nunca se guardó en la BD, no puede estar en ninguna lista
  const inLists =
    mediaItem && lists.length
      ? await db
          .select({ id: listItems.id, listId: listItems.listId })
          .from(listItems)
          .where(
            and(
              eq(listItems.mediaItemId, mediaItem.id),
              inArray(listItems.listId, lists.map((l) => l.id))
            )
          )
      : [];

  const itemByList = new Map(inLists.map((i) => [i.listId, i.id]));
  return lists.map((l) => ({ ...l, listItemId: itemByList.get(l.id) ?? null }));
}

export async function getListMembership(listId: string, userId: string) {
  const [member] = await db
    .select()
    .from(listMembers)
    .where(
      and(eq(listMembers.listId, listId), eq(listMembers.userId, userId))
    )
    .limit(1);
  
  return member ?? null;
}

export async function requireListMember(listId: string, userId: string) {
  const member = await getListMembership(listId, userId);
  if (!member) {
    throw new Error("FORBIDDEN");
  }

  return member;
}