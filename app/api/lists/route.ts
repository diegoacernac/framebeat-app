import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "../../../lib/db";
import { listMembers, sharedLists } from "../../../lib/db/schema";
import { createClient } from "../../../lib/supabase/server";
import { createListSchema } from "../../../lib/validations/list";
import { title } from "process";
import { error } from "console";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const lists = await db
    .select({
      id: sharedLists.id,
      title: sharedLists.title,
      description: sharedLists.description,
      ownerId: sharedLists.ownerId,
      createdAt: sharedLists.createdAt,
      role: listMembers.role,
    })
    .from(listMembers)
    .innerJoin(sharedLists, eq(listMembers.listId, sharedLists.id))
    .where(eq(listMembers.userId, user.id));

    return NextResponse.json({ lists });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await request.json();
  const parsed = createListSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message },
      { status: 400 }
    );
  }

  const [list] = await db
    .insert(sharedLists)
    .values({
      ownerId: user.id,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
    })
    .returning();

  await db.insert(listMembers).values({
    listId: list.id,
    userId: user.id,
    role: "owner",
  });

  return NextResponse.json(list, { status: 201 });
}