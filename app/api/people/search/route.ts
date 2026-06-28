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

  return Response.json({ results: (data.results ?? []).slice(0,6) });
}