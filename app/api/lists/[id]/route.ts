import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { sharedLists } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import { requireListMember } from "@/lib/lists";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: listId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  let member;
  try {
    member = await requireListMember(listId, user.id);
  } catch {
    return NextResponse.json({ error: "Sin acceso a esta lista" }, { status: 403 });
  }

  if (member.role !== "owner") {
    return NextResponse.json(
      { error: "Solo quien creó la lista puede borrarla" },
      { status: 403 }
    );
  }

  // ON DELETE CASCADE borra solo miembros, ítems y progreso de esta lista
  await db.delete(sharedLists).where(eq(sharedLists.id, listId));

  return NextResponse.json({ ok: true });
}
