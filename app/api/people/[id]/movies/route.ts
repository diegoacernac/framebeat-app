export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const url = new URL(`https://api.themoviedb.org/3/person/${id}/movie_credits`);
  url.searchParams.set("api_key", process.env.TMDB_API_KEY!);
  url.searchParams.set("language", "es-ES");

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
  const data = await res.json();

  type RawMovie = {
    id: number;
    title: string;
    release_date: string;
    poster_path: string | null;
    job?: string;
  };

  const asActor: RawMovie[] = data.cast ?? [];
  const asDirector: RawMovie[] = ((data.crew ?? []) as RawMovie[]).filter(
    (m) => m.job === "Director"
  );

  const seen = new Set<number>();
  const movies = [...asActor, ...asDirector].filter((m) => {
    if (seen.has(m.id)) return false;
    seen.add(m.id);
    return true;
  });

  movies.sort((a, b) =>
    (b.release_date ?? "").localeCompare(a.release_date ?? "")
  );

  return Response.json({ movies });
}
