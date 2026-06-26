import { NextResponse } from "next/server";
import { getMovie } from "@/lib/tmdb";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const movieId = Number(id);
  if (Number.isNaN(movieId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  try {
    const movie = await getMovie(movieId);
    return NextResponse.json(movie);
  } catch {
    return NextResponse.json({ error: "Película no encontrada" }, { status: 404 });
  }
}