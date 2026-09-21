import type { Person } from "@/components/discover/PeopleSearch";

// Géneros TMDB: 12=Aventura, 18=Drama, 27=Terror, 28=Acción, 35=Comedia,
// 36=Historia, 53=Thriller, 99=Documental, 878=Sci-Fi, 9648=Misterio,
// 10749=Romance, 10752=Bélica
//
// match "any" → la peli tiene AL MENOS UNO de los géneros (TMDB: "|")
// match "all" → la peli tiene TODOS los géneros (TMDB: ",")
export type GenreMatch = "any" | "all";

export const MOODS: {
  id: string;
  label: string;
  genres: string[];
  match: GenreMatch;
}[] = [
  { id: "cenar",       label: "Para cenar",    genres: ["35", "12"],   match: "any" },
  { id: "profunda",    label: "Algo profundo", genres: ["18", "36"],   match: "any" },
  { id: "reir",        label: "Para reír",     genres: ["35"],         match: "any" },
  { id: "accion",      label: "Acción",        genres: ["28", "12"],   match: "any" },
  { id: "suspenso",    label: "Suspenso",      genres: ["53", "9648"], match: "any" },
  { id: "scifi",       label: "Sci-Fi",        genres: ["878"],        match: "any" },
  // Antes era romance O drama → salía cualquier drama. Ahora solo romance.
  { id: "romance",     label: "Romántica",     genres: ["10749"],      match: "any" },
  { id: "belica",      label: "Bélica",        genres: ["10752"],      match: "any" },
  { id: "documental",  label: "Documentales",  genres: ["99"],         match: "any" },
  { id: "terror",      label: "Terror",        genres: ["27"],         match: "any" },
  // Thriller Y drama a la vez: el thriller psicológico, no cualquier drama.
  { id: "psicologica", label: "Psicológicas",  genres: ["53", "18"],   match: "all" },
];

type DiscoverSearchParams = {
  providers?: string;
  mood?: string;
  acclaimed?: string;
  decade?: string;
  runtime?: string;
  people?: string;
};

// Traduce los searchParams de la URL a filtros. Lo usan la página /discover
// y la ruta /api/discover ("Ver más"), así ambas interpretan igual la URL.
export function parseDiscoverParams(params: DiscoverSearchParams) {
  const providers = params.providers?.split(",").filter(Boolean) ?? [];
  const mood = params.mood ?? "";
  const moodDef = MOODS.find((m) => m.id === mood);
  const acclaimed = params.acclaimed === "1";
  const decade = params.decade ?? "";
  const runtime = params.runtime ?? "";
  // "123:Christopher Nolan:Directing,456:Tom Hanks:Acting"
  const people: Person[] = params.people
    ? params.people.split(",").map((s) => {
        const [id, name, department] = s.split(":");
        return { id: Number(id), name, department };
      })
    : [];

  const hasFilters =
    providers.length > 0 ||
    moodDef !== undefined ||
    acclaimed ||
    decade !== "" ||
    runtime !== "" ||
    people.length > 0;

  return {
    mood,
    people,
    hasFilters,
    filters: {
      providers,
      genres: moodDef?.genres ?? [],
      genreMatch: moodDef?.match ?? "any",
      acclaimed,
      decade,
      runtime,
      people: people.map((p) => p.id),
    },
  };
}
