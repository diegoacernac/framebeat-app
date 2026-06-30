import { NextRequest, NextResponse } from "next/server";
import { searchTv } from "../../../../lib/tmdb";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") ?? "";
  if (!q.trim()) return NextResponse.json({ results: [] });

  try {
    const results = await searchTv(q);
    return NextResponse.json({
      results: results.map((tv) => ({
        id: tv.id,
        title: tv.name,
        release_date: tv.first_air_date,
        poster_path: tv.poster_path,
        overview: tv.overview,
      })),
    });
  } catch {
    return NextResponse.json({ error: "Error al buscar"}, { status: 500 });
  }
}