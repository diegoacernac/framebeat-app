"use client";

import { useState } from "react";
import { FilmSlateIcon, TelevisionSimpleIcon } from "@phosphor-icons/react/dist/ssr";
import { SectionLabel } from "../ui/section-label";
import { ListAddMovieSearch } from "./ListAddMovieSearch";
import { segmentedGroupClass, segmentedItemClass } from "@/components/ui/segmented";

// "Añadir a la lista": un solo buscador con selector Películas / Series
// (antes eran dos bloques iguales, uno debajo del otro)
export function ListAddPanel({ listId, existingKeys }: { listId: string; existingKeys: string[] }) {
  const [kind, setKind] = useState<"movie" | "tv">("movie");

  return (
    <div className="space-y-4 border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <SectionLabel as="h2">Añadir</SectionLabel>
        <div role="group" aria-label="Tipo" className={segmentedGroupClass}>
          {(
            [
              { id: "movie", label: "Películas", icon: FilmSlateIcon },
              { id: "tv", label: "Series", icon: TelevisionSimpleIcon },
            ] as const
          ).map((k) => {
            const active = kind === k.id;
            const Icon = k.icon;
            return (
              <button
                key={k.id}
                type="button"
                onClick={() => setKind(k.id)}
                aria-pressed={active}
                className={segmentedItemClass(active, "sm")}
              >
                <Icon size={13} weight={active ? "fill" : "regular"} />
                {k.label}
              </button>
            );
          })}
        </div>
      </div>
      {/* key: al cambiar de tipo, el buscador arranca limpio */}
      <ListAddMovieSearch key={kind} listId={listId} kind={kind} existingKeys={existingKeys} />
    </div>
  );
}
