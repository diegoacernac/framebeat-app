import { NextRequest, NextResponse } from "next/server";
import { findStudio, searchMovies } from "@/lib/tmdb";

// Búsqueda de películas: por título y, si lo buscado es un estudio ("marvel",
// "pixar", "ghibli"), también sus películas más populares en "studio".
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") ?? "";
  if (!q.trim()) return NextResponse.json({ results: [], studio: null });

  try {
    const [results, studio] = await Promise.all([
      searchMovies(q),
      // Si falla la detección de estudio, igual devolvemos los títulos
      findStudio(q).catch(() => null),
    ]);
    return NextResponse.json({ results, studio });
  } catch {
    return NextResponse.json({ error: "Error al buscar" }, { status: 500 });
  }
}
