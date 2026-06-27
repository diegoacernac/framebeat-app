import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { listItemProgress } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import { listProgressSchema } from "@/lib/validations/list";
import { requireListMember } from "@/lib/lists";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: listId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  try {
    await requireListMember(listId, user.id);
  } catch {
    return NextResponse.json({ error: "Sin acceso a esta lista" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = listProgressSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message },
      { status: 400 }
    );
  }

  const { mediaItemId, completed } = parsed.data;

  if (completed) {
    await db
      .insert(listItemProgress)
      .values({ listId, mediaItemId, userId: user.id })
      .onConflictDoNothing();
  } else {
    await db
      .delete(listItemProgress)
      .where(
        and(
          eq(listItemProgress.listId, listId),
          eq(listItemProgress.mediaItemId, mediaItemId),
          eq(listItemProgress.userId, user.id)
        )
      );
  }

  return NextResponse.json({ ok: true });
}