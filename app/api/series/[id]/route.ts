import { NextResponse } from "next/server";
import { getTv } from "../../../../lib/tmdb";
import { error } from "console";

export async function GET(
  _request: Request,
  { params } : { params: Promise<{id: string }> }
) {
  const { id } = await params;
  const tvId = Number(id);
  if (Number.isNaN(tvId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  try {
    const tv = await getTv(tvId);
    return NextResponse.json(tv);
  } catch {
    return NextResponse.json({ error: "Serie no encontrada" });
  }
}