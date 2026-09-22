"use client";

import Image from "next/image";
import Link from "next/link";
import { useDebouncedFetch } from "@/hooks/useDebouncedFetch";
import { mediaKey, useAddToList } from "@/hooks/useAddToList";
import { getPosterUrl } from "@/lib/tmdb";
import type { Suggestion, SuggestionGroup } from "@/lib/list-suggestions";
import { cn } from "@/lib/utils";
import { Skeleton } from "../ui/skeleton";
import { HorizontalScroller } from "../ui/horizontal-scroller";
import { PosterRowSkeleton } from "../media/PosterRowSkeleton";
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
  const addToList = useAddToList(listId, existingKeys);
  const groups = data?.groups ?? [];

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-4 w-28" />
        <PosterRowSkeleton />
      </div>
    );
  }

  // Sin nada que sugerir (título genérico y lista vacía): no mostramos la sección
  if (groups.length === 0) return null;

  return (
    <section className="space-y-6 animate-in fade-in duration-300">
      <div className="space-y-1">
        <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Sugerencias
        </h2>
        <AddFeedback feedback={addToList.feedback} />
      </div>

      {groups.map((group) => (
        <SuggestionRow key={group.key} group={group} addToList={addToList} />
      ))}
    </section>
  );
}

function SuggestionRow({
  group,
  addToList,
}: {
  group: SuggestionGroup;
  addToList: ReturnType<typeof useAddToList>;
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">{group.title}</h3>
      {/* Flechas a mitad del poster: ancho de tarjeta × 1.5 (2:3) / 2 */}
      <HorizontalScroller arrowClassName="[--card-w:8rem] lg:[--card-w:9rem] top-[calc(var(--card-w)*0.75)]">
        {group.items.map((item) => (
          <SuggestionCard key={mediaKey(item.type, item.id)} item={item} addToList={addToList} />
        ))}
      </HorizontalScroller>
    </div>
  );
}

function SuggestionCard({
  item,
  addToList,
}: {
  item: Suggestion;
  addToList: ReturnType<typeof useAddToList>;
}) {
  const inList = addToList.isInList(item.type, item.id);
  const poster = getPosterUrl(item.posterPath, "w342");
  const href = `${item.type === "tv" ? "/series" : "/movies"}/${item.id}`;

  return (
    <li className="group/card w-28 shrink-0 snap-start space-y-2 sm:w-32 lg:w-36">
      <div className="relative aspect-[2/3] overflow-hidden bg-muted ring-1 ring-transparent transition-shadow duration-200 group-hover/card:ring-foreground/30">
        <Link href={href} className="absolute inset-0" title={item.title}>
          {poster ? (
            <Image
              src={poster}
              alt={item.title}
              fill
              sizes="(min-width: 1024px) 144px, 128px"
              className={cn(
                "object-cover transition-[transform,opacity] duration-300 group-hover/card:scale-105",
                inList && "opacity-40"
              )}
            />
          ) : (
            <span className="flex h-full items-center justify-center p-2 text-center text-xs text-muted-foreground">
              {item.title}
            </span>
          )}

          {/* Al pasar el mouse: título completo, año, nota y sinopsis */}
          <span className="absolute inset-0 flex flex-col justify-end gap-1 bg-gradient-to-t from-black via-black/80 to-black/10 p-2.5 text-white opacity-0 transition-opacity duration-200 group-hover/card:opacity-100">
            <span className="text-xs font-medium leading-snug">{item.title}</span>
            <span className="flex items-center gap-2 text-[10px] text-white/70">
              {item.year}
              {item.rating > 0 && (
                <span className="text-amber-400">★ {item.rating.toFixed(1)}</span>
              )}
            </span>
            {item.overview && (
              <span className="line-clamp-4 text-[10px] leading-snug text-white/70">
                {item.overview}
              </span>
            )}
          </span>
        </Link>

        <div className="absolute right-1.5 top-1.5">
          <AddMediaButton
            compact
            inList={inList}
            adding={addToList.isAdding(item.type, item.id)}
            onAdd={() => addToList.add(item)}
          />
        </div>
      </div>

      {/* En web el nombre completo sale al pasar el mouse (y en el tooltip);
          en móvil, sin hover, damos una línea más */}
      <div title={item.title}>
        <p className="line-clamp-3 text-xs font-medium leading-snug sm:line-clamp-2">{item.title}</p>
        <p className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
          {item.year}
          {item.rating > 0 && <span className="text-amber-500/90">★ {item.rating.toFixed(1)}</span>}
        </p>
      </div>
    </li>
  );
}
