import { tmdbFetch } from "@/lib/tmdb";

type RawMovie = {
  id: number;
  title: string;
  release_date: string;
  poster_path: string | null;
  overview: string;
  vote_average: number;
  vote_count: number;
  job?: string;
  character?: string;
};

// Apariciones como sí mismo (documentales, especiales) o sin crédito
const NOT_A_ROLE = /\b(self|himself|herself|themselves)\b|uncredited|sin acreditar/i;

// Mínimo de votos para contar como parte de su filmografía: por debajo suelen
// ser cortos, documentales o apariciones menores ("Verity or: How I Learned...")
const MIN_VOTES = { Directing: 100, Acting: 50 } as const;

// Filmografía de una persona según su rol: si es director, lo que dirigió
// (no lo que produjo ni donde aparece); si es actor, donde actúa.
// ?department=Acting|Directing viene del buscador; si falta, usamos por lo
// que es conocida según TMDB.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const requested = new URL(request.url).searchParams.get("department");

  try {
    const [credits, department] = await Promise.all([
      tmdbFetch<{ cast: RawMovie[]; crew: RawMovie[] }>(`/person/${id}/movie_credits`),
      requested === "Directing" || requested === "Acting"
        ? (requested as keyof typeof MIN_VOTES)
        : tmdbFetch<{ known_for_department: string }>(`/person/${id}`).then((p) =>
            p.known_for_department === "Directing" ? ("Directing" as const) : ("Acting" as const)
          ),
    ]);

    const credited =
      department === "Directing"
        ? credits.crew.filter((m) => m.job === "Director")
        : credits.cast.filter((m) => !NOT_A_ROLE.test(m.character ?? ""));

    const seen = new Set<number>();
    const movies = credited
      .filter((m) => m.vote_count >= MIN_VOTES[department])
      .filter((m) => !seen.has(m.id) && seen.add(m.id))
      // De la más nueva a la más antigua
      .sort((a, b) => (b.release_date ?? "").localeCompare(a.release_date ?? ""));

    return Response.json({ movies, department });
  } catch {
    return Response.json({ error: "No se pudo cargar la filmografía" }, { status: 500 });
  }
}
