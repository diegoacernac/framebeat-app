"use client";

import Image from "next/image";
import Link from "next/link";
import { useDebouncedFetch } from "@/hooks/useDebouncedFetch";
import { mediaKey, useAddToList } from "@/hooks/useAddToList";
import { getPosterUrl } from "@/lib/tmdb";
import type { SuggestionGroup } from "@/lib/list-suggestions";
import { Skeleton } from "../ui/skeleton";
import { AddFeedback, AddMediaButton } from "./AddMediaButton";

type Props = {
  listId: string;
  existingKeys: string[];
};

// Filas horizontales de sugerencias ("Dirigidas por Christopher Nolan",
// "Resident Evil - Colección"...) con un + en cada poster para añadirla.
// Se piden una vez al cargar: lo que se va añadiendo se marca ✓ aquí mismo.
export function ListSuggestions({ listId, existingKeys }: Props) {
  const { data, loading } = useDebouncedFetch<{ groups?: SuggestionGroup[] }>(
    `/api/lists/${listId}/suggestions`,
    0
  );
  const { add, isInList, isAdding, feedback } = useAddToList(listId, existingKeys);
  const groups = data?.groups ?? [];

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-4 w-48" />
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="aspect-[2/3] w-24 shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  // Sin nada que sugerir (título genérico y lista vacía): no mostramos la sección
  if (groups.length === 0) return null;

  return (
    <section className="space-y-5 animate-in fade-in duration-300">
      <div className="space-y-1">
        <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Sugerencias
        </h2>
        <AddFeedback feedback={feedback} />
      </div>

      {groups.map((group) => (
        <div key={group.key} className="space-y-2">
          <h3 className="text-sm font-medium">{group.title}</h3>
          {/* Scroll horizontal; el margen negativo deja que llegue al borde en móvil */}
          <ul className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
            {group.items.map((item) => {
              const inList = isInList(item.type, item.id);
              const poster = getPosterUrl(item.posterPath, "w185");
              return (
                <li key={mediaKey(item.type, item.id)} className="w-24 shrink-0 snap-start space-y-1.5">
                  <div className="relative aspect-[2/3] overflow-hidden bg-muted">
                    <Link
                      href={`${item.type === "tv" ? "/series" : "/movies"}/${item.id}`}
                      className="absolute inset-0"
                      title={item.title}
                    >
                      {poster ? (
                        <Image
                          src={poster}
                          alt={item.title}
                          fill
                          sizes="96px"
                          className={inList ? "object-cover opacity-40" : "object-cover"}
                        />
                      ) : (
                        <span className="flex h-full items-center justify-center p-1 text-center text-[10px] text-muted-foreground">
                          Sin poster
                        </span>
                      )}
                    </Link>
                    <div className="absolute right-1 top-1">
                      <AddMediaButton
                        compact
                        inList={inList}
                        adding={isAdding(item.type, item.id)}
                        onAdd={() => add(item)}
                      />
                    </div>
                  </div>
                  <p className="line-clamp-2 text-xs leading-tight">{item.title}</p>
                  {item.year && <p className="text-[10px] text-muted-foreground">{item.year}</p>}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </section>
  );
}
