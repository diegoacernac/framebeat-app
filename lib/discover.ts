import type { Person } from "@/components/discover/PeopleSearch";

export type DiscoverKind = "movie" | "tv";

// Géneros TMDB de PELÍCULAS: 12=Aventura, 18=Drama, 27=Terror, 28=Acción,
// 35=Comedia, 36=Historia, 53=Thriller, 99=Documental, 878=Sci-Fi,
// 9648=Misterio, 10749=Romance, 10752=Bélica
//
// Las SERIES tienen otra lista: 10759=Acción y aventura, 80=Crimen,
// 10765=Sci-Fi y fantasía, 10768=Bélica y política... y NO tienen Terror,
// Thriller ni Romance. Por eso cada situación define sus géneros de series
// aparte (tv); si no tiene, no se puede usar con series.
//
// match "any" → tiene AL MENOS UNO de los géneros (TMDB: "|")
// match "all" → tiene TODOS los géneros (TMDB: ",")
export type GenreMatch = "any" | "all";

type GenreSet = { genres: string[]; match: GenreMatch };

export const MOODS: {
  id: string;
  label: string;
  movie: GenreSet;
  tv?: GenreSet;
}[] = [
  { id: "cenar",       label: "Para cenar",    movie: { genres: ["35", "12"],   match: "any" }, tv: { genres: ["35", "10759"], match: "any" } },
  { id: "profunda",    label: "Algo profundo", movie: { genres: ["18", "36"],   match: "any" }, tv: { genres: ["18"],          match: "any" } },
  { id: "reir",        label: "Para reír",     movie: { genres: ["35"],         match: "any" }, tv: { genres: ["35"],          match: "any" } },
  { id: "accion",      label: "Acción",        movie: { genres: ["28", "12"],   match: "any" }, tv: { genres: ["10759"],       match: "any" } },
  { id: "suspenso",    label: "Suspenso",      movie: { genres: ["53", "9648"], match: "any" }, tv: { genres: ["9648", "80"], match: "any" } },
  { id: "scifi",       label: "Sci-Fi",        movie: { genres: ["878"],        match: "any" }, tv: { genres: ["10765"],       match: "any" } },
  // Antes era romance O drama → salía cualquier drama. Ahora solo romance.
  { id: "romance",     label: "Romántica",     movie: { genres: ["10749"],      match: "any" } },
  { id: "belica",      label: "Bélica",        movie: { genres: ["10752"],      match: "any" }, tv: { genres: ["10768"],       match: "any" } },
  { id: "documental",  label: "Documentales",  movie: { genres: ["99"],         match: "any" }, tv: { genres: ["99"],          match: "any" } },
  { id: "terror",      label: "Terror",        movie: { genres: ["27"],         match: "any" } },
  // Thriller Y drama a la vez: el thriller psicológico, no cualquier drama.
  // En series: misterio Y drama.
  { id: "psicologica", label: "Psicológicas",  movie: { genres: ["53", "18"],   match: "all" }, tv: { genres: ["9648", "18"], match: "all" } },
];

// Link a "¿Qué vemos?" filtrado por una persona. Mismo formato que arma
// DiscoverFilters en la URL: "id:nombre:departamento"
export function getPersonDiscoverHref(
  id: number,
  name: string,
  department: "Acting" | "Directing"
) {
  const people = `${id}:${name.replace(/[:,]/g, " ")}:${department}`;
  return `/discover?${new URLSearchParams({ people }).toString()}`;
}

type DiscoverSearchParams = {
  type?: string;
  avail?: string;
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
  const kind: DiscoverKind = params.type === "tv" ? "tv" : "movie";
  // Por defecto SOLO lo que tiene dónde verse en Perú; "avail=0" lo desactiva
  const available = params.avail !== "0";
  const providers = params.providers?.split(",").filter(Boolean) ?? [];
  const mood = params.mood ?? "";
  const genreSet = MOODS.find((m) => m.id === mood)?.[kind];
  const acclaimed = params.acclaimed === "1";
  const decade = params.decade ?? "";
  // TMDB no filtra series por persona, y la duración de una serie es por
  // episodio (no tiene sentido "Larga +2h"): con series se ignoran ambos
  const runtime = kind === "movie" ? params.runtime ?? "" : "";
  // "123:Christopher Nolan:Directing,456:Tom Hanks:Acting"
  const people: Person[] =
    kind === "movie" && params.people
      ? params.people.split(",").map((s) => {
          const [id, name, department] = s.split(":");
          return { id: Number(id), name, department };
        })
      : [];

  const hasFilters =
    providers.length > 0 ||
    genreSet !== undefined ||
    acclaimed ||
    decade !== "" ||
    runtime !== "" ||
    people.length > 0;

  return {
    kind,
    mood,
    people,
    hasFilters,
    filters: {
      kind,
      available,
      providers,
      genres: genreSet?.genres ?? [],
      genreMatch: genreSet?.match ?? "any",
      acclaimed,
      decade,
      runtime,
      people: people.map((p) => ({ id: p.id, department: p.department })),
    },
  };
}
