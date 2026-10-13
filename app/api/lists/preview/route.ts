import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getListSuggestions } from "@/lib/list-suggestions";

// Vista previa al crear una lista: qué sugeriría la app con este título y
// descripción ("Maratón Nolan" → Dirigidas por Christopher Nolan). Mismo
// motor que las sugerencias de la lista ya creada. Solo con sesión.
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const params = new URL(request.url).searchParams;
  const title = (params.get("title") ?? "").slice(0, 200);
  const description = (params.get("description") ?? "").slice(0, 500);
  if (!title.trim() && !description.trim()) return NextResponse.json({ groups: [] });

  try {
    const groups = await getListSuggestions({ title, description, entries: [] });
    // Para la vista previa basta con el nombre del grupo y unos pósters
    return NextResponse.json({
      groups: groups.map((g) => ({
        key: g.key,
        title: g.title,
        total: g.items.length,
        items: g.items.slice(0, 8).map((i) => ({ id: i.id, title: i.title, posterPath: i.posterPath })),
      })),
    });
  } catch {
    return NextResponse.json({ groups: [] });
  }
}
