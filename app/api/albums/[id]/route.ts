import { NextResponse } from "next/server";
import { getAlbum } from "@/lib/spotify";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const album = await getAlbum(id);
    return NextResponse.json(album);
  } catch (error) {
    console.error("[albums/[id]]", error);
    return NextResponse.json({ error: "Álbum no encontrado" }, { status: 404 });
  }
}
