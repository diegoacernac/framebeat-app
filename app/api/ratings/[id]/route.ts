import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { ratings } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import { updateRatingSchema } from "@/lib/validations/rating";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const rating = await db.query.ratings.findFirst({ where: eq(ratings.id, id) });
  if (!rating) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  if (rating.userId !== user.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = updateRatingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message },
      { status: 400 }
    );
  }

  const [updated] = await db
    .update(ratings)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(ratings.id, id))
    .returning();

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const rating = await db.query.ratings.findFirst({ where: eq(ratings.id, id) });
  if (!rating) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  if (rating.userId !== user.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  await db.delete(ratings).where(eq(ratings.id, id));
  return NextResponse.json({ ok: true });
}
