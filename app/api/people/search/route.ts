export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";

  if (!q.trim()) return Response.json({ results: [] });

  const url = new URL("https://api.themoviedb.org/3/search/person");
  url.searchParams.set("api_key", process.env.TMDB_API_KEY!);
  url.searchParams.set("language", "es-ES");
  url.searchParams.set("query", q);

  const res = await fetch(url.toString(), { next: { revalidate: 60 } });
  const data = await res.json();

  // TMDB llama "known_for_department" a lo que en el resto de la app es
  // "department" (Acting | Directing): sin esto la URL guardaba "undefined"
  type TmdbPerson = { id: number; name: string; known_for_department: string };
  const results = ((data.results ?? []) as TmdbPerson[]).slice(0, 6).map((p) => ({
    id: p.id,
    name: p.name,
    department: p.known_for_department,
  }));

  return Response.json({ results });
}