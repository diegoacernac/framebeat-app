import { NextRequest, NextResponse } from "next/server";
import { searchAlbums } from "@/lib/spotify";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") ?? "";
  if (!q.trim()) return NextResponse.json({ results: [] });

  try {
    const results = await searchAlbums(q);
    return NextResponse.json({ results });
  } catch (error) {
    console.error("[albums/search]", error);
    const message =
      error instanceof Error ? error.message : "Error al buscar álbumes";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
