import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { listMembers } from "./db/schema";

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