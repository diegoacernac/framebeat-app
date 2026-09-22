import { tmdbFetch } from "@/lib/tmdb";

// Sugerencias para una lista a partir de su título, su descripción y lo que
// ya tiene. "Maratón Nolan" → su filmografía; "Resident Evil" → la saga;
// "Noche de terror" → terror bien valorado; y parecidas a lo que ya añadieron.

export type Suggestion = {
  id: number;
  type: "movie" | "tv";
  title: string;
  year: string | null;
  posterPath: string | null;
  overview: string;
};

export type SuggestionGroup = {
  key: string;
  title: string;
  items: Suggestion[];
};

const GROUP_SIZE = 18;

// Palabras que no aportan a la búsqueda. No se borran del texto (romperían
// "Guillermo del Toro"): solo descartan frases que empiezan o terminan con ellas.
const STOPWORDS = new Set([
  "a", "al", "con", "de", "del", "el", "en", "la", "las", "lo", "los", "mi", "mis",
  "nuestra", "nuestras", "nuestros", "para", "por", "que", "su", "sus", "un", "una",
  "y", "o", "the", "of", "and", "or",
  "maraton", "pelis", "peli", "pelicula", "peliculas", "serie", "series", "lista",
  "favoritas", "favoritos", "mejores", "top", "todas", "todos", "toda", "todo", "ver",
  "noche", "fin", "semana", "finde", "saga", "sagas", "coleccion", "filmografia",
  "director", "directora", "actor", "actriz", "clasicos", "clasicas", "juntos",
  "pendientes", "vistas", "cine", "domingo", "sabado", "viernes",
]);

// Géneros de películas de TMDB por palabra (sin tildes, en minúscula)
const GENRE_WORDS: Record<string, { id: string; label: string }> = {
  terror: { id: "27", label: "Terror" },
  horror: { id: "27", label: "Terror" },
  miedo: { id: "27", label: "Terror" },
  comedia: { id: "35", label: "Comedia" },
  comedias: { id: "35", label: "Comedia" },
  accion: { id: "28", label: "Acción" },
  aventura: { id: "12", label: "Aventura" },
  aventuras: { id: "12", label: "Aventura" },
  romance: { id: "10749", label: "Romance" },
  romantica: { id: "10749", label: "Romance" },
  romanticas: { id: "10749", label: "Romance" },
  animacion: { id: "16", label: "Animación" },
  animadas: { id: "16", label: "Animación" },
  anime: { id: "16", label: "Animación" },
  documental: { id: "99", label: "Documental" },
  documentales: { id: "99", label: "Documental" },
  drama: { id: "18", label: "Drama" },
  dramas: { id: "18", label: "Drama" },
  suspenso: { id: "53", label: "Suspenso" },
  thriller: { id: "53", label: "Suspenso" },
  thrillers: { id: "53", label: "Suspenso" },
  belica: { id: "10752", label: "Bélicas" },
  belicas: { id: "10752", label: "Bélicas" },
  guerra: { id: "10752", label: "Bélicas" },
  western: { id: "37", label: "Western" },
  westerns: { id: "37", label: "Western" },
  vaqueros: { id: "37", label: "Western" },
  musical: { id: "10402", label: "Musicales" },
  musicales: { id: "10402", label: "Musicales" },
  fantasia: { id: "14", label: "Fantasía" },
  crimen: { id: "80", label: "Crimen" },
  policial: { id: "80", label: "Crimen" },
  policiales: { id: "80", label: "Crimen" },
  misterio: { id: "9648", label: "Misterio" },
  familiar: { id: "10751", label: "Familiares" },
  familiares: { id: "10751", label: "Familiares" },
  infantil: { id: "10751", label: "Familiares" },
  infantiles: { id: "10751", label: "Familiares" },
  historicas: { id: "36", label: "Históricas" },
  llorar: { id: "18", label: "Drama" },
  reir: { id: "35", label: "Comedia" },
  risas: { id: "35", label: "Comedia" },
  sustos: { id: "27", label: "Terror" },
  "ciencia ficcion": { id: "878", label: "Ciencia ficción" },
  scifi: { id: "878", label: "Ciencia ficción" },
  "sci fi": { id: "878", label: "Ciencia ficción" },
};

// "los 80", "1990s", "ochentas", "2000" → década. Los números de 2 cifras
// solo valen del 50 al 90 (un "10" suelto no es una década).
const DECADE_WORDS: Record<string, number> = {
  cincuenta: 1950, cincuentas: 1950, sesenta: 1960, sesentas: 1960,
  setenta: 1970, setentas: 1970, ochenta: 1980, ochentas: 1980,
  noventa: 1990, noventas: 1990,
};

function findDecade(text: string) {
  for (const word of normalize(text).split(/[^a-z0-9]+/)) {
    if (DECADE_WORDS[word]) return DECADE_WORDS[word];
    const short = word.match(/^([5-9]0)s?$/);
    if (short) return 1900 + Number(short[1]);
    const full = word.match(/^(19[5-9]0|20[0-2]0)s?$/);
    if (full) return Number(full[1]);
  }
  return null;
}

function normalize(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

// Frases candidatas: n-gramas de hasta 4 palabras dentro de cada trozo del
// texto (cortamos en comas, puntos, saltos de línea...), las largas primero.
type Candidate = { text: string; start: number; end: number };

function getCandidates(text: string) {
  const candidates: Candidate[] = [];
  let offset = 0;
  for (const segment of normalize(text).split(/[,.;:!?¡¿()\n\/|&]+/)) {
    const words = segment.split(/[^a-z0-9ñ']+/).filter(Boolean);
    for (let n = Math.min(4, words.length); n >= 1; n--) {
      for (let i = 0; i + n <= words.length; i++) {
        const gram = words.slice(i, i + n);
        if (STOPWORDS.has(gram[0]) || STOPWORDS.has(gram[n - 1])) continue;
        const phrase = gram.join(" ");
        if (phrase.length < 3) continue;
        candidates.push({ text: phrase, start: offset + i, end: offset + i + n });
      }
    }
    offset += words.length + 1; // +1: nunca se juntan palabras de trozos distintos
  }
  return candidates.sort((a, b) => b.end - b.start - (a.end - a.start));
}

// Que el nombre contenga la frase como palabras completas: "nolan" sí está en
// "christopher nolan", pero "ter" no está en "peter"
function containsWords(name: string, phrase: string) {
  return ` ${normalize(name).replace(/[^a-z0-9ñ]+/g, " ")} `.includes(` ${phrase} `);
}

type TmdbPerson = {
  id: number;
  name: string;
  known_for_department: string;
  popularity: number;
};

type Credit = {
  id: number;
  title: string;
  release_date?: string;
  poster_path: string | null;
  overview: string;
  popularity: number;
  vote_count: number;
  job?: string;
};

type Paged<T> = { results: T[] };

async function findPerson(phrase: string) {
  const data = await tmdbFetch<Paged<TmdbPerson>>("/search/person", { query: phrase });
  // Con una sola palabra exigimos más popularidad: "terror" o "noche" pueden
  // ser el nombre de alguien desconocido. (Escala de TMDB: Nolan ~5, Denis
  // Villeneuve ~3.5, un actor de reparto cualquiera < 1)
  const minPopularity = phrase.includes(" ") ? 0.5 : 1.5;
  const matches = data.results.filter(
    (p) =>
      (p.known_for_department === "Directing" || p.known_for_department === "Acting") &&
      p.popularity >= minPopularity &&
      containsWords(p.name, phrase)
  );
  // "villeneuve" → Denis, no el primero que devuelva la búsqueda
  return matches.sort((a, b) => b.popularity - a.popularity)[0] ?? null;
}

// Sin artículo inicial: "el señor de los anillos" ↔ "señor de los anillos"
const withoutArticle = (text: string) => text.replace(/^(el|la|los|las|the) /, "");

async function findCollection(phrase: string) {
  if (phrase.length < 4) return null;
  const data = await tmdbFetch<Paged<{ id: number; name: string; original_name?: string }>>(
    "/search/collection",
    { query: phrase }
  );
  // El nombre de la saga (sin "- Colección" ni artículo), en español o en el
  // original, tiene que ser la frase o empezar por ella; con una sola palabra,
  // exactamente ella. Así "pareja" no trae "La extraña pareja", y "star wars"
  // encuentra "La guerra de las galaxias" (original: "Star Wars Collection")
  // antes que la de LEGO.
  const base = (name: string) =>
    withoutArticle(
      normalize(name)
        .replace(/\s*[-–:]?\s*(coleccion|collection|saga|trilogia)\s*$/, "")
        .replace(/[^a-z0-9ñ]+/g, " ")
        .trim()
    );
  const target = withoutArticle(phrase);
  const oneWord = !target.includes(" ");

  const scored = data.results
    .map((c) => {
      const names = [c.name, c.original_name ?? ""].filter(Boolean).map(base);
      const exact = names.includes(target);
      const prefix = !oneWord && names.some((n) => n.startsWith(`${target} `));
      return { c, exact, prefix, length: Math.min(...names.map((n) => n.length)) };
    })
    .filter((x) => x.exact || x.prefix)
    .sort((a, b) => Number(b.exact) - Number(a.exact) || a.length - b.length);
  return scored[0]?.c ?? null;
}

async function findCollectionByMovieTitle(title: string) {
  const data = await tmdbFetch<Paged<Credit>>("/search/movie", { query: title });
  // Solo las muy votadas: un título genérico ("Para ver en pareja") siempre
  // encuentra alguna película desconocida
  const movie = data.results.find((m) => m.vote_count >= 1000);
  if (!movie) return null;
  const detail = await tmdbFetch<{ belongs_to_collection: { id: number; name: string } | null }>(
    `/movie/${movie.id}`
  );
  return detail.belongs_to_collection;
}

function toSuggestion(c: Credit): Suggestion {
  return {
    id: c.id,
    type: "movie",
    title: c.title,
    year: c.release_date?.slice(0, 4) || null,
    posterPath: c.poster_path,
    overview: c.overview,
  };
}

const today = () => new Date().toISOString().slice(0, 10);

async function personGroup(person: TmdbPerson): Promise<SuggestionGroup> {
  const data = await tmdbFetch<{ cast: Credit[]; crew: Credit[] }>(
    `/person/${person.id}/movie_credits`
  );
  const released = (c: Credit) => Boolean(c.release_date) && c.release_date! <= today();

  if (person.known_for_department === "Directing") {
    // Su filmografía como director, de la más nueva a la más antigua
    const directed = data.crew
      // Con pocos votos suelen ser cortos o recopilatorios, no su filmografía
      .filter((c) => c.job === "Director" && released(c) && c.vote_count >= 100)
      .sort((a, b) => b.release_date!.localeCompare(a.release_date!));
    return {
      key: `person-${person.id}`,
      title: `Dirigidas por ${person.name}`,
      items: directed.slice(0, GROUP_SIZE).map(toSuggestion),
    };
  }

  // Actores: sus películas más conocidas (descartamos cameos muy oscuros)
  const acted = data.cast
    .filter((c) => released(c) && c.vote_count >= 50)
    .sort((a, b) => b.popularity - a.popularity);
  return {
    key: `person-${person.id}`,
    title: `Con ${person.name}`,
    items: acted.slice(0, GROUP_SIZE).map(toSuggestion),
  };
}

async function collectionGroup(collection: { id: number; name: string }): Promise<SuggestionGroup> {
  const data = await tmdbFetch<{ name: string; parts: Credit[] }>(`/collection/${collection.id}`);
  const parts = data.parts
    .filter((p) => p.release_date)
    .sort((a, b) => a.release_date!.localeCompare(b.release_date!));
  return {
    key: `collection-${collection.id}`,
    title: data.name,
    items: parts.slice(0, GROUP_SIZE).map(toSuggestion),
  };
}

// Géneros y/o década juntos: "comedias románticas de los 90" → comedia Y
// romance estrenadas en los 90, bien valoradas
async function discoverGroup(
  genres: { id: string; label: string }[],
  decade: number | null
): Promise<SuggestionGroup> {
  const params: Record<string, string> = {
    sort_by: "popularity.desc",
    "vote_average.gte": "7",
    "vote_count.gte": decade && decade < 2000 ? "300" : "500",
  };
  if (genres.length) params.with_genres = genres.map((g) => g.id).join(",");
  if (decade) {
    params["primary_release_date.gte"] = `${decade}-01-01`;
    params["primary_release_date.lte"] = `${decade + 9}-12-31`;
  }
  const data = await tmdbFetch<Paged<Credit>>("/discover/movie", params);

  const genreLabel = genres.map((g) => g.label).join(" + ");
  const decadeLabel = decade ? `de los ${decade < 2000 ? decade - 1900 : decade}` : "";
  return {
    key: `discover-${params.with_genres ?? ""}-${decade ?? ""}`,
    title: genreLabel
      ? `${genreLabel} ${decadeLabel || "bien valoradas"}`.trim()
      : `Lo mejor ${decadeLabel}`,
    items: data.results.slice(0, GROUP_SIZE).map(toSuggestion),
  };
}

type ListEntry = { type: string; externalId: string; title: string };

// Recomendaciones de TMDB para lo último que añadieron. Las que se repiten
// entre varias (parecidas a más de una) van primero.
async function similarGroup(entries: ListEntry[]): Promise<SuggestionGroup | null> {
  const recent = entries
    .filter((e) => e.type === "movie" || e.type === "tv")
    .slice(-4);
  if (recent.length === 0) return null;

  type Rec = Credit & { name?: string; first_air_date?: string };
  const pages = await Promise.all(
    recent.map((e) =>
      tmdbFetch<Paged<Rec>>(`/${e.type}/${e.externalId}/recommendations`).then((d) =>
        d.results.map((r) => ({ ...r, type: e.type as "movie" | "tv" }))
      ).catch(() => [])
    )
  );

  const scored = new Map<string, { item: Suggestion; score: number }>();
  pages.forEach((results) =>
    results.forEach((r, rank) => {
      const key = `${r.type}:${r.id}`;
      const prev = scored.get(key);
      // Mejor posición en la lista de recomendaciones = más puntos
      const points = 1 + (20 - Math.min(rank, 19)) / 20;
      if (prev) prev.score += points;
      else
        scored.set(key, {
          score: points,
          item: {
            id: r.id,
            type: r.type,
            title: r.title ?? r.name ?? "",
            year: (r.release_date ?? r.first_air_date)?.slice(0, 4) || null,
            posterPath: r.poster_path,
            overview: r.overview,
          },
        });
    })
  );

  const items = [...scored.values()]
    .sort((a, b) => b.score - a.score)
    .map((s) => s.item)
    .slice(0, GROUP_SIZE);
  const last = recent[recent.length - 1];
  return {
    key: "similar",
    title: recent.length === 1 ? `Parecidas a «${last.title}»` : "Parecidas a lo que ya tienen",
    items,
  };
}

export async function getListSuggestions(list: {
  title: string;
  description: string | null;
  entries: ListEntry[];
}): Promise<SuggestionGroup[]> {
  const text = `${list.title}\n${list.description ?? ""}`;
  const candidates = getCandidates(text).slice(0, 12);

  // Buscamos personas y sagas para todas las frases a la vez (TMDB cachea 1h)
  const lookups = await Promise.all(
    candidates.map(async (c) => {
      const [person, collection] = await Promise.all([
        findPerson(c.text).catch(() => null),
        findCollection(c.text).catch(() => null),
      ]);
      return { ...c, person, collection };
    })
  );

  // Frases largas primero: si "christopher nolan" encontró algo, "nolan"
  // solo ya no cuenta (esas palabras quedan usadas)
  const used = new Set<number>();
  const people: TmdbPerson[] = [];
  const collections: { id: number; name: string }[] = [];
  const genres = new Map<string, { id: string; label: string }>();
  const decade = findDecade(text);

  for (const c of lookups) {
    const positions = Array.from({ length: c.end - c.start }, (_, i) => c.start + i);
    if (positions.every((p) => used.has(p))) continue;

    const genre = GENRE_WORDS[c.text];
    // Un género es más probable que una persona llamada "Drama"
    if (genre) genres.set(genre.id, genre);
    else if (c.collection && collections.length < 2) collections.push(c.collection);
    else if (c.person && people.length < 2 && !people.some((p) => p.id === c.person!.id))
      people.push(c.person);
    else continue;

    positions.forEach((p) => used.add(p));
  }

  // Último intento si el texto no dio nada: el título como película. Si es
  // una muy conocida que pertenece a una saga ("Matrix", "Volver al futuro"),
  // sugerimos la saga aunque el nombre de la colección no coincida.
  if (!people.length && !collections.length && !genres.size && !decade) {
    const saga = await findCollectionByMovieTitle(list.title).catch(() => null);
    if (saga) collections.push(saga);
  }

  const groups = await Promise.all([
    ...people.map((p) => personGroup(p).catch(() => null)),
    ...collections.map((c) => collectionGroup(c).catch(() => null)),
    genres.size > 0 || decade
      ? discoverGroup([...genres.values()].slice(0, 2), decade).catch(() => null)
      : null,
    similarGroup(list.entries).catch(() => null),
  ]);

  // Lo que ya está en la lista no se sugiere
  const inList = new Set(list.entries.map((e) => `${e.type}:${e.externalId}`));
  return groups
    .filter((g): g is SuggestionGroup => g !== null)
    .map((g) => ({ ...g, items: g.items.filter((i) => !inList.has(`${i.type}:${i.id}`)) }))
    .filter((g) => g.items.length > 0);
}
