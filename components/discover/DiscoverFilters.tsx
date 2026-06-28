"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { PeopleSearch, type Person } from "./PeopleSearch";

// IDs de TMDB para Perú
const PLATFORMS = [
  { id: "8", name: "Netflix" },
  { id: "119", name: "Prime" },
  { id: "337", name: "Disney+" },
  { id: "350", name: "Apple TV+" },
  { id: "384", name: "HBO/Max" },
];

// Mapeo -> generenos de TMDB
// Géneros: 35=Comedia, 18=Drama, 28=Acción, 12=Aventura, 53=Thriller, 878=Sci-Fi, 10749=Romance
const MOODS = [
  { id : "cenar", label: "Para cenar", genres: ["35", "12"] },
  { id: "profunda", label: "Algo profundo",  genres: ["18", "36"] },
  { id: "reir",     label: "Para reír",      genres: ["35"] },
  { id: "accion",   label: "Acción",         genres: ["28", "12"] },
  { id: "suspenso", label: "Suspenso",       genres: ["53", "9648"] },
  { id: "scifi",    label: "Sci-Fi",         genres: ["878"] },
  { id: "romance",  label: "Romántica",      genres: ["10749", "18"] },
];

const DECADES = [
  { id: "90s",   label: "90s" },
  { id: "2000s", label: "2000s" },
  { id: "2010s", label: "2010s" },
  { id: "2020s", label: "2020s" },
];

const RUNTIMES = [
  { id: "short",  label: "Cortita  <90min" },
  { id: "normal", label: "Normal  ~2h" },
  { id: "long",   label: "Larga  +2h" },
];

type Props = {
  initialProviders: string[];
  initialMood: string;
  initialAcclaimed: boolean;
  initialDecade: string;
  initialRuntime: string;
  initialPeople: Person[];
};

export function DiscoverFilters({
  initialProviders,
  initialMood,
  initialAcclaimed,
  initialDecade,
  initialRuntime,
  initialPeople,
}: Props) {
  const router = useRouter();
  const [providers, setProviders] = useState<Set<string>>(new Set(initialProviders));
  const [acclaimed, setAcclaimed] = useState(initialAcclaimed);
  const [decade, setDecade] = useState(initialDecade);
  const [runtime, setRuntime] = useState(initialRuntime);
  const [mood, setMood] = useState(initialMood);
  const [people, setPeople] = useState<Person[]>(initialPeople);

  function toggleProvider(id: string) {
    setProviders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function buildParams(page = 1) {
    const p = new URLSearchParams();
    if (providers.size > 0) p.set("providers", [...providers].join(","));
    if (mood)      p.set("mood", mood);
    if (acclaimed) p.set("acclaimed", "1");
    if (decade)    p.set("decade", decade);
    if (runtime)   p.set("runtime", runtime);
    if (page > 1)  p.set("page", String(page));
    if (people.length > 0) {
      // Guardamos "id:nombre" para poder reconstruir los chips al recargar
      p.set("people", people.map((p) => `${p.id}:${p.name}:${p.department}`).join(","));
    }

    return p.toString();
  }

  function handleSearch() {
    router.push(`/discover?${buildParams(1)}`);
  }

  function handleShuffle() {
    // Math.floor(Math.random() * 4) da 0,1,2,3 → sumamos 2 para página 2-5
    const randomPage = Math.floor(Math.random() * 4) + 2;
    router.push(`/discover?${buildParams(randomPage)}`);
  }

  // Clase helper para no repetir la lógica de active/inactive en cada botón
  function pillClass(active: boolean) {
    return cn(
      "border px-3 py-1 text-sm transition-colors",
      active
        ? "border-amber-500 bg-amber-500/10 text-amber-500"
        : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
    );
  }

  return (
    <div className="space-y-6">
      {/* Plataformas */}
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Plataforma</p>
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map((p) => (
            <button key={p.id} type="button" onClick={() => toggleProvider(p.id)} className={pillClass(providers.has(p.id))}>
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Situación */}
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Situación</p>
        <div className="flex flex-wrap gap-2">
          {MOODS.map((m) => (
            <button key={m.id} type="button" onClick={() => setMood((prev) => prev === m.id ? "" : m.id)} className={pillClass(mood === m.id)}>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Época */}
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Época</p>
        <div className="flex flex-wrap gap-2">
          {DECADES.map((d) => (
            <button key={d.id} type="button" onClick={() => setDecade((prev) => prev === d.id ? "" : d.id)} className={pillClass(decade === d.id)}>
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Duración */}
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Duración</p>
        <div className="flex flex-wrap gap-2">
          {RUNTIMES.map((r) => (
            <button key={r.id} type="button" onClick={() => setRuntime((prev) => prev === r.id ? "" : r.id)} className={pillClass(runtime === r.id)}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Solo aclamadas */}
      <div>
        <button type="button" onClick={() => setAcclaimed((prev) => !prev)} className={pillClass(acclaimed)}>
          ★ Solo aclamadas (7.5+)
        </button>
      </div>

      {/* Director / Actor */}
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Director o actor
        </p>
        <PeopleSearch selected={people} onChange={setPeople} />
      </div>

      {/* Acciones */}
      <div className="flex gap-2">
        <Button onClick={handleSearch}>Buscar</Button>
        <Button variant="outline" onClick={handleShuffle}>Mezclar</Button>
      </div>
    </div>
  );
}