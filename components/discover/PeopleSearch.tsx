"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "../ui/input";

export type Person = {
  id: number;
  name: string;
  department: string; // Acting | Directing ...
};

type Props = {
  selected: Person[];
  onChange: (people: Person[]) => void;
};

export function PeopleSearch({ selected, onChange }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Person[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query.trim()) { setResults([]); setOpen(false); return; }

    const timer = setTimeout(async () => {
      const res = await fetch(`/api/people/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data.results ?? []);
      setOpen(true);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function select(person: Person) {
    if (!selected.find((p) => p.id === person.id)) {
      onChange([...selected, person]);
    }
    setQuery("");
    setOpen(false);
  }

  function remove(id: number) {
    onChange(selected.filter((p) => p.id !== id));
  }

  function deptLabel(dept: string) {
    if (dept === "Acting")    return "Actor/Actriz";
    if (dept === "Directing") return "Director/a";
    return dept;
  }

  return (
    <div className="space-y-2" ref={containerRef}>
      {/* Chips de los seleccionados */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((p) => (
            <span
              key={p.id}
              className="flex items-center gap-1 border border-amber-500 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-500"
            >
              {p.name}
              <button
                type="button"
                onClick={() => remove(p.id)}
                className="ml-0.5 hover:text-foreground"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input + dropdown */}
      <div className="relative">
        <Input
          placeholder="Buscar director o actor..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        {open && results.length > 0 && (
          <div className="absolute left-0 right-0 top-full z-10 mt-1 border bg-background shadow-lg">
            {results.map((person) => (
              <button
                key={person.id}
                type="button"
                onClick={() => select(person)}
                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
              >
                <span className="font-medium">{person.name}</span>
                <span className="text-xs text-muted-foreground">
                  {deptLabel(person.department)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
