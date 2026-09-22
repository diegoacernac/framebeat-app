import { NextRequest, NextResponse } from "next/server";
import { discoverMedia } from "@/lib/tmdb";
import { parseDiscoverParams } from "@/lib/discover";

// Devuelve una página de /discover con los mismos filtros de la URL.
// La usa el botón "Ver más" de DiscoverResults.
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  // Sin filtros = lo más popular en Perú (igual que la página)
  const { filters } = parseDiscoverParams(Object.fromEntries(sp));

  const page = Math.max(1, Math.min(Number(sp.get("page")) || 1, 500));

  try {
    const { results, totalPages } = await discoverMedia({ ...filters, page });
    return NextResponse.json({ results, totalPages });
  } catch {
    return NextResponse.json({ error: "Error al cargar resultados" }, { status: 500 });
  }
}
