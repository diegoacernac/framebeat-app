"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react/dist/ssr";
import { useDebouncedFetch } from "@/hooks/useDebouncedFetch";
import { mediaKey, useAddToList } from "@/hooks/useAddToList";
import { getPosterUrl } from "@/lib/tmdb";
import type { Suggestion, SuggestionGroup } from "@/lib/list-suggestions";
import { cn } from "@/lib/utils";
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
  const addToList = useAddToList(listId, existingKeys);
  const groups = data?.groups ?? [];

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-4 w-48" />
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="aspect-[2/3] w-28 shrink-0 sm:w-32 lg:w-36" />
          ))}
        </div>
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

// Una fila con scroll horizontal. Sin barra de scroll visible: en web se
// mueve con flechas (aparecen al pasar el mouse), en móvil deslizando.
function SuggestionRow({
  group,
  addToList,
}: {
  group: SuggestionGroup;
  addToList: ReturnType<typeof useAddToList>;
}) {
  const scrollerRef = useRef<HTMLUListElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  function updateArrows() {
    const el = scrollerRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }

  // Al montar y cuando cambia el ancho (girar el móvil, redimensionar)
  useEffect(() => {
    updateArrows();
    const el = scrollerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(updateArrows);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  function scrollBy(direction: 1 | -1) {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" });
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">{group.title}</h3>

      <div className="group/row relative">
        <ul
          ref={scrollerRef}
          onScroll={updateArrows}
          className={cn(
            "-mx-4 flex snap-x gap-3 overflow-x-auto scroll-smooth px-4 sm:mx-0 sm:px-0",
            "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            // Desvanecido en el borde por el que hay más: indica que se puede deslizar
            canRight && "sm:[mask-image:linear-gradient(to_right,black_85%,transparent)]"
          )}
        >
          {group.items.map((item) => (
            <SuggestionCard key={mediaKey(item.type, item.id)} item={item} addToList={addToList} />
          ))}
        </ul>

        {/* Flechas: solo con mouse (md+), a la altura del poster */}
        {canLeft && (
          <ArrowButton direction="left" onClick={() => scrollBy(-1)} />
        )}
        {canRight && (
          <ArrowButton direction="right" onClick={() => scrollBy(1)} />
        )}
      </div>
    </div>
  );
}

function ArrowButton({ direction, onClick }: { direction: "left" | "right"; onClick: () => void }) {
  const Icon = direction === "left" ? CaretLeftIcon : CaretRightIcon;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === "left" ? "Ver anteriores" : "Ver más"}
      className={cn(
        "absolute top-[calc((var(--card-w)*1.5)/2)] z-10 hidden size-9 -translate-y-1/2 items-center justify-center border border-foreground/20 bg-background/90 text-foreground shadow-lg backdrop-blur transition-opacity md:flex",
        "opacity-0 group-hover/row:opacity-100 focus-visible:opacity-100 hover:border-foreground/60",
        "[--card-w:8rem] lg:[--card-w:9rem]",
        direction === "left" ? "-left-4" : "-right-4"
      )}
    >
      <Icon size={16} weight="bold" />
    </button>
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
