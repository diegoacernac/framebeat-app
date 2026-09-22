import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "../../../../../lib/db";
import { listMembers, profiles } from "../../../../../lib/db/schema";
import { createClient } from "../../../../../lib/supabase/server";
import { inviteMemberSchema } from "../../../../../lib/validations/list";
import { requireListMember } from "../../../../../lib/lists";

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
  const parsed = inviteMemberSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message },
      {status: 400 }
    );
  }

  const invited = await db.query.profiles.findFirst({
    where: eq(profiles.username, parsed.data.username),
  });

  if (!invited) {
    return NextResponse.json({ error: "No existe ese usuario" }, { status: 404 });
  }
  if (invited.userId === user.id) {
    return NextResponse.json({ error: "No puedes invitarte a ti mismo" }, { status: 400 });
  }

  const existing = await db.query.listMembers.findFirst({
    where: and(
      eq(listMembers.listId, listId),
      eq(listMembers.userId, invited.userId)
    ),
  });

  if (existing) {
    return NextResponse.json(
      {
        error:
          existing.status === "pending"
            ? "Ya tiene una invitación pendiente"
            : "Ya está en la lista",
      },
      { status: 409 }
    );
  }

  // Queda pendiente: no ve la lista (ni se hacen visibles sus calificaciones)
  // hasta que acepte desde "Mis listas"
  await db.insert(listMembers).values({
    listId,
    userId: invited.userId,
    role: "member",
    status: "pending",
  });

  return NextResponse.json(
    { username: invited.username, userId: invited.userId },
    { status: 201}
  );
}