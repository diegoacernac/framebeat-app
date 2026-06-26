import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { mediaItems, ratings } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import { createRatingSchema } from "@/lib/validations/rating";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await request.json();
  const parsed = createRatingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message },
      { status: 400 }
    );
  }

  const { tmdbId, title, posterUrl, metadata, stars, review } = parsed.data;
  const externalId = String(tmdbId);

  let mediaItem = await db.query.mediaItems.findFirst({
    where: eq(mediaItems.externalId, externalId),
  });

  if (!mediaItem) {
    const [created] = await db
      .insert(mediaItems)
      .values({
        type: "movie",
        externalId,
        title,
        posterUrl: posterUrl ?? null,
        metadata: metadata ?? {},
      })
      .returning();
    mediaItem = created;
  }

  try {
    const [rating] = await db
      .insert(ratings)
      .values({
        userId: user.id,
        mediaItemId: mediaItem.id,
        stars,
        review: review ?? null,
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json(rating, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Ya calificaste esta película" },
      { status: 409 }
    );
  }
}
