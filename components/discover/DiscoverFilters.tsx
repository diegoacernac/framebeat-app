"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FilmSlateIcon, TelevisionSimpleIcon } from "@phosphor-icons/react/dist/ssr";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { Spinner } from "../ui/spinner";
import { PeopleSearch, type Person } from "./PeopleSearch";
import { MOODS, type DiscoverKind } from "@/lib/discover";

// IDs de TMDB para Perú (son los mismos para películas y series)
const PLATFORMS = [
  { id: "8", name: "Netflix" },
  { id: "119", name: "Prime" },
  { id: "337", name: "Disney+" },
  { id: "350", name: "Apple TV+" },
  { id: "384", name: "HBO/Max" },
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

const KINDS: { id: DiscoverKind; label: string; icon: typeof FilmSlateIcon }[] = [
  { id: "movie", label: "Películas", icon: FilmSlateIcon },
  { id: "tv",    label: "Series",    icon: TelevisionSimpleIcon },
];

type Props = {
  initialKind: DiscoverKind;
  initialAvailable: boolean;
  initialProviders: string[];
  initialMood: string;
  initialAcclaimed: boolean;
  initialDecade: string;
  initialRuntime: string;
  initialPeople: Person[];
};

export function DiscoverFilters({
  initialKind,
  initialAvailable,
  initialProviders,
  initialMood,
  initialAcclaimed,
  initialDecade,
  initialRuntime,
  initialPeople,
}: Props) {
  const router = useRouter();
  const [kind, setKind] = useState<DiscoverKind>(initialKind);
  const [available, setAvailable] = useState(initialAvailable);
  const [providers, setProviders] = useState<Set<string>>(new Set(initialProviders));
  const [acclaimed, setAcclaimed] = useState(initialAcclaimed);
  const [decade, setDecade] = useState(initialDecade);
  const [runtime, setRuntime] = useState(initialRuntime);
  const [mood, setMood] = useState(initialMood);
  const [people, setPeople] = useState<Person[]>(initialPeople);

  // isPending dura hasta que el servidor trae los resultados nuevos.
  // pendingAction dice QUÉ botón se pulsó, para poner el spinner solo en ese.
  const [isPending, startTransition] = useTransition();
  const [pendingAction, setPendingAction] = useState<"search" | "shuffle" | null>(null);

  const isTv = kind === "tv";

  function changeKind(next: DiscoverKind) {
    setKind(next);
    // Si la situación elegida no existe para series (Terror, Romántica), se quita
    if (next === "tv" && !MOODS.find((m) => m.id === mood)?.tv) setMood("");
  }

  function toggleProvider(id: string) {
    setProviders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function buildParams() {
    const p = new URLSearchParams();
    if (isTv)       p.set("type", "tv");
    if (!available) p.set("avail", "0");
    if (providers.size > 0) p.set("providers", [...providers].join(","));
    if (mood)      p.set("mood", mood);
    if (acclaimed) p.set("acclaimed", "1");
    if (decade)    p.set("decade", decade);
    // Duración y personas solo aplican a películas
    if (!isTv && runtime) p.set("runtime", runtime);
    if (!isTv && people.length > 0) {
      // Guardamos "id:nombre" para poder reconstruir los chips al recargar
      p.set("people", people.map((p) => `${p.id}:${p.name}:${p.department}`).join(","));
    }

    return p;
  }

  function navigate(params: URLSearchParams, action: "search" | "shuffle") {
    setPendingAction(action);
    startTransition(() => {
      router.push(`/discover?${params.toString()}`);
    });
  }

  function handleSearch() {
    navigate(buildParams(), "search");
  }

  function handleShuffle() {
    const p = buildParams();
    p.set("shuffle", "1");
    // Valor único para que la navegación se dispare aunque los filtros no
    // hayan cambiado desde el último "Mezclar" — la página real la elige el
    // server según cuántos resultados reales hay para estos filtros.
    p.set("r", Math.random().toString(36).slice(2, 8));
    navigate(p, "shuffle");
  }

  // Clase helper para no repetir la lógica de active/inactive en cada botón
  function pillClass(active: boolean) {
    return cn(
      "border px-3 py-1 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-border disabled:hover:text-muted-foreground",
      active
        ? "border-amber-500 bg-amber-500/10 text-amber-500"
        : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
    );
  }

  return (
    // data-pending: DiscoverResults lo detecta con CSS para atenuar los resultados viejos
    <div className="space-y-6" data-pending={isPending || undefined}>
      {/* Películas / Series */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex border" role="group" aria-label="Tipo">
          {KINDS.map((k) => {
            const KindIcon = k.icon;
            const active = kind === k.id;
            return (
              <button
                key={k.id}
                type="button"
                onClick={() => changeKind(k.id)}
                aria-pressed={active}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors",
                  active
                    ? "bg-amber-500/10 text-amber-500"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <KindIcon size={16} weight={active ? "fill" : "regular"} />
                {k.label}
              </button>
            );
          })}
        </div>

        {/* Solo lo que se puede ver en Perú */}
        <button
          type="button"
          onClick={() => setAvailable((a) => !a)}
          aria-pressed={available}
          className={pillClass(available)}
        >
          {available ? "✓ " : ""}Solo con dónde ver en Perú
        </button>
      </div>

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
          {MOODS.map((m) => {
            // TMDB no tiene géneros de Terror ni Romance para series
            const unavailable = isTv && !m.tv;
            return (
              <button
                key={m.id}
                type="button"
                disabled={unavailable}
                title={unavailable ? "No disponible para series" : undefined}
                onClick={() => setMood((prev) => prev === m.id ? "" : m.id)}
                className={pillClass(mood === m.id)}
              >
                {m.label}
              </button>
            );
          })}
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

      {/* Duración: solo películas (en series sería por episodio) */}
      {!isTv && (
        <div className="space-y-2 animate-in fade-in duration-200">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Duración</p>
          <div className="flex flex-wrap gap-2">
            {RUNTIMES.map((r) => (
              <button key={r.id} type="button" onClick={() => setRuntime((prev) => prev === r.id ? "" : r.id)} className={pillClass(runtime === r.id)}>
                {r.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Solo aclamadas */}
      <div>
        <button type="button" onClick={() => setAcclaimed((prev) => !prev)} className={pillClass(acclaimed)}>
          ★ Solo aclamadas (7.5+)
        </button>
      </div>

      {/* Director / Actor: solo películas (TMDB no filtra series por persona) */}
      {!isTv && (
        <div className="space-y-2 animate-in fade-in duration-200">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Director o actor
          </p>
          <PeopleSearch selected={people} onChange={setPeople} />
        </div>
      )}

      {/* Acciones */}
      <div className="flex gap-2">
        <Button onClick={handleSearch} disabled={isPending}>
          {isPending && pendingAction === "search" ? (
            <>
              <Spinner /> Buscando...
            </>
          ) : (
            "Buscar"
          )}
        </Button>
        <Button variant="outline" onClick={handleShuffle} disabled={isPending}>
          {isPending && pendingAction === "shuffle" ? (
            <>
              <Spinner /> Mezclando...
            </>
          ) : (
            "Mezclar"
          )}
        </Button>
      </div>
    </div>
  );
}
