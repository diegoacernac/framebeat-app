import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "../../../../../../lib/db";
import { listItemProgress, listItems } from "../../../../../../lib/db/schema";
import { createClient } from "../../../../../../lib/supabase/server";
import { requireListMember } from "../../../../../../lib/lists";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const { id: listId, itemId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  try {
    await requireListMember(listId, user.id)
  } catch {
    return NextResponse.json({ error: "Sin acceso a esta lista" }, { status: 403 })
  }

  // El item debe pertenecer a la lista en cuestión
  const item = await db.query.listItems.findFirst({
    where: and(eq(listItems.id, itemId), eq(listItems.listId, listId))
  });
  if (!item) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  await db.transaction(async (tx) => {
    await tx
      .delete(listItemProgress)
      .where(
        and(
          eq(listItemProgress.listId, listId),
          eq(listItemProgress.mediaItemId, item.mediaItemId)
        )
      );
    await tx.delete(listItems).where(eq(listItems.id, item.id));
  });

  return NextResponse.json({ ok: true });
}