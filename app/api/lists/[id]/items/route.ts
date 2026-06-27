import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { listItems, mediaItems } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import { addListItemSchema } from "@/lib/validations/list";
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
  const parsed = addListItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message },
      { status: 400 }
    );
  }

  const { mediaType, externalId, title, posterUrl, metadata } = parsed.data;

  let mediaItem = await db.query.mediaItems.findFirst({
    where: and(
      eq(mediaItems.type, mediaType),
      eq(mediaItems.externalId, externalId)
    ),
  });

  if (!mediaItem) {
    const [created] = await db
      .insert(mediaItems)
      .values({
        type: mediaType,
        externalId,
        title,
        posterUrl: posterUrl ?? null,
        metadata: metadata ?? {},
      })
      .returning();
    mediaItem = created;
  }

  try {
    const [item] = await db
      .insert(listItems)
      .values({
        listId,
        mediaItemId: mediaItem.id,
        addedBy: user.id,
      })
      .returning();

    return NextResponse.json(item, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Este ítem ya está en la lista" },
      { status: 409 }
    );
  }
}