import { NextRequest, NextResponse } from "next/server";
import { searchMovies } from "@/lib/tmdb";
import { error } from "console";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") ?? "";
  if (!q.trim()) return NextResponse.json({ results: [] });

  try {
    const results = await searchMovies(q);
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ error: "Error al buscar" }, { status: 500 });
  }
}