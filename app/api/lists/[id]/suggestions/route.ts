import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { listItems, mediaItems, sharedLists } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import { requireListMember } from "@/lib/lists";
import { getListSuggestions } from "@/lib/list-suggestions";

// Sugerencias para la lista según su título, descripción y lo que ya tiene.
// Aparte de la página para no demorarla: el cliente las pide al cargar.
export async function GET(
  _request: Request,
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

  const [list, entries] = await Promise.all([
    db.query.sharedLists.findFirst({ where: eq(sharedLists.id, listId) }),
    db
      .select({ type: mediaItems.type, externalId: mediaItems.externalId, title: mediaItems.title })
      .from(listItems)
      .innerJoin(mediaItems, eq(listItems.mediaItemId, mediaItems.id))
      .where(eq(listItems.listId, listId))
      .orderBy(asc(listItems.createdAt)),
  ]);
  if (!list) return NextResponse.json({ error: "Lista no encontrada" }, { status: 404 });

  try {
    const groups = await getListSuggestions({
      title: list.title,
      description: list.description,
      entries,
    });
    return NextResponse.json({ groups });
  } catch {
    return NextResponse.json({ error: "No se pudieron cargar sugerencias" }, { status: 500 });
  }
}
