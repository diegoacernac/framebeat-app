import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { listMembers } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";

const respondSchema = z.object({ accept: z.boolean() });

// Responder una invitación a una lista: aceptar (pasa a miembro y ve la
// lista) o rechazar (se borra la invitación). Solo la persona invitada.
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

  const parsed = respondSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Respuesta inválida" }, { status: 400 });
  }

  const pending = and(
    eq(listMembers.listId, listId),
    eq(listMembers.userId, user.id),
    eq(listMembers.status, "pending")
  );

  const updated = parsed.data.accept
    ? await db
        .update(listMembers)
        .set({ status: "accepted", joinedAt: new Date() })
        .where(pending)
        .returning()
    : await db.delete(listMembers).where(pending).returning();

  if (updated.length === 0) {
    return NextResponse.json({ error: "No hay una invitación pendiente" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
