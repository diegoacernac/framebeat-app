"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StarRating } from "../ratings/StarRatings";
import { useOptimistic, useState, useTransition } from "react";
import { CheckIcon, StarIcon, TrashIcon } from "@phosphor-icons/react/dist/ssr";
import { Spinner } from "../ui/spinner";
import { cn } from "@/lib/utils";
import { getMediaHref } from "@/lib/media";

type MemberRating = {
  userId: string;
  username: string;
  stars: number;
  review: string | null;
};

type Props = {
  listId: string;
  listItemId: string;
  mediaItemId: string;
  title: string;
  year: number | null;
  posterUrl: string | null;
  mediaType: "movie" | "album" | "tv";
  externalId: string;
  averageStars: number | null;
  memberRatings: MemberRating[];
  completed: boolean;
  currentUserId: string;
  // Número de la fila (1, 2, 3...), como en una playlist
  index?: number;
};

export function ListItemRow({
  listId,
  listItemId,
  mediaItemId,
  title,
  year,
  posterUrl,
  mediaType,
  externalId,
  averageStars,
  memberRatings,
  completed,
  currentUserId,
  index,
}: Props) {
  const router = useRouter();
  const href = getMediaHref(mediaType, externalId);

  // useOptimistic: el botón cambia AL INSTANTE; si la API falla, React vuelve
  // solo al valor real (`completed`) cuando termina la transición.
  const [optimisticCompleted, setOptimisticCompleted] = useOptimistic(completed);
  const [, startToggle] = useTransition();

  function toggleCompleted() {
    startToggle(async () => {
      setOptimisticCompleted(!completed);
      await fetch(`/api/lists/${listId}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaItemId, completed: !completed }),
      });
      router.refresh();
    });
  }

  // removing: esperando a la API · collapsing: la API dijo OK, la fila se pliega
  const [removing, setRemoving] = useState(false);
  const [collapsing, setCollapsing] = useState(false);
  const [, startRefresh] = useTransition();

  async function removeItem() {
    if (!confirm(`¿Quitar "${title}" de la lista?`)) return;

    setRemoving(true);
    const res = await fetch(`/api/lists/${listId}/items/${listItemId}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      setRemoving(false);
      alert("No se pudo quitar. Intenta de nuevo.");
      return;
    }

    setCollapsing(true);
    // Dejamos que termine la animación de plegado (300ms) antes de refrescar,
    // si no la fila desaparecería de golpe cuando el servidor responde rápido.
    setTimeout(() => startRefresh(() => router.refresh()), 300);
  }

  const myRating = memberRatings.find((r) => r.userId === currentUserId);
  // Calificar lleva directo al formulario de la ficha (en series, a las temporadas)
  const rateHref = `${href}#${mediaType === "tv" ? "temporadas" : "calificar"}`;
  const isPortrait = mediaType !== "album";

  return (
    // Truco para animar la altura a 0: grid con una fila que pasa de 1fr a 0fr
    <div
      className={cn(
        "grid transition-[grid-template-rows,opacity] duration-300 ease-out",
        collapsing ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"
      )}
    >
    {/* Contenedor sin padding: el py-4 del article impediría llegar a altura 0 */}
    <div className="min-h-0 overflow-hidden">
    <article
      className={cn(
        // Fila tipo playlist: una línea, acciones redondas a la derecha
        "group/row flex items-center gap-3 border-b px-1 py-2.5 transition-[background-color] duration-200 hover:bg-card sm:gap-4 sm:px-2",
        // Entrada: al añadir un ítem, solo la fila nueva se monta y se anima
        "animate-in fade-in slide-in-from-top-2 duration-300",
        removing && "pointer-events-none opacity-40"
      )}
      aria-busy={removing}
    >
      {index !== undefined && (
        // En móvil sin número (como Spotify): el espacio es para el título
        <span className="hidden w-5 shrink-0 text-right text-sm tabular-nums text-muted-foreground sm:block">
          {index}
        </span>
      )}

      {/* Vista: póster y título apagados (las acciones siguen a color) */}
      <Link
        href={href}
        className={cn(
          "group relative shrink-0 overflow-hidden bg-muted transition-opacity",
          isPortrait ? "w-10 aspect-[2/3] sm:w-11 lg:w-12" : "size-10 sm:size-11 lg:size-12",
          optimisticCompleted && "opacity-45"
        )}
      >
        {posterUrl ? (
          <Image
            src={posterUrl}
            alt={title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="48px"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">—</div>
        )}
      </Link>

      <div className={cn("min-w-0 flex-1 space-y-1 transition-opacity", optimisticCompleted && "opacity-55")}>
        {/* En móvil hasta 2 líneas (cortar en "Kill Bill: …" no dejaba saber cuál era) */}
        <Link href={href} className="line-clamp-2 font-medium leading-snug hover:underline sm:line-clamp-1">
          {title}
          {year && <span className="ml-2 text-sm font-normal tabular-nums text-muted-foreground">{year}</span>}
        </Link>

        {/* Notas de los miembros (sin calificaciones no se muestra nada) */}
        {memberRatings.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 sm:gap-x-4">
            {memberRatings.map((r) => (
              <span key={r.userId} className="flex items-center gap-1.5">
                <Link href={`/u/${r.username}`} className="text-xs text-muted-foreground hover:text-foreground hover:underline">
                  @{r.username}
                </Link>
                <StarRating value={r.stars} readOnly size={11} />
              </span>
            ))}
          </div>
        )}
        {memberRatings
          .filter((r) => r.review)
          .slice(0, 1)
          .map((r) => (
            <p key={r.userId} className="line-clamp-1 font-sans text-[13px] text-muted-foreground">
              “{r.review}”
            </p>
          ))}
      </div>

      {averageStars !== null && (
        <span className="hidden shrink-0 text-sm font-medium tabular-nums text-primary sm:block">
          ★ {averageStars.toFixed(1)}
        </span>
      )}

      {/* Acciones redondas, en la línea del botón "Elegir al azar" */}
      <div className="flex shrink-0 items-center gap-2 sm:gap-1.5">
        <button
          type="button"
          onClick={toggleCompleted}
          aria-pressed={optimisticCompleted}
          aria-label={optimisticCompleted ? `Desmarcar "${title}" como vista` : `Marcar "${title}" como vista`}
          title={optimisticCompleted ? "Vista · tocar para desmarcar" : "Marcar como vista"}
          className={cn(
            "flex size-8 items-center justify-center rounded-full border transition-all duration-200 active:scale-90 sm:size-9",
            optimisticCompleted
              ? "border-primary bg-primary text-primary-foreground"
              : "border-foreground/20 text-muted-foreground hover:border-foreground/60 hover:text-foreground"
          )}
        >
          {/* key distinta → se re-monta y el ✓ hace un pequeño "pop" */}
          <CheckIcon key={String(optimisticCompleted)} size={15} weight="bold" className="animate-in zoom-in-50 duration-200" />
        </button>

        {myRating ? (
          <Link
            href={rateHref}
            title="Tu nota · tocar para cambiarla"
            className="flex h-8 items-center gap-1 rounded-full border border-primary/40 px-2.5 text-xs font-medium tabular-nums text-primary transition-colors hover:border-primary sm:h-9 sm:px-3"
          >
            ★ {myRating.stars}
          </Link>
        ) : (
          <Link
            href={rateHref}
            aria-label={`Calificar "${title}"`}
            title="Calificar"
            className="flex size-8 items-center justify-center rounded-full border border-foreground/20 text-muted-foreground transition-colors hover:border-primary hover:text-primary sm:size-9"
          >
            <StarIcon size={15} />
          </Link>
        )}

        {/* Quitar: secundaria. En web aparece al pasar por la fila; en móvil, siempre */}
        <button
          type="button"
          onClick={removeItem}
          disabled={removing}
          aria-label={`Quitar "${title}" de la lista`}
          title="Quitar de la lista"
          className="-mr-1 flex size-8 items-center justify-center rounded-full text-muted-foreground transition-[color,opacity] hover:text-destructive focus-visible:opacity-100 sm:mr-0 sm:size-9 lg:opacity-0 lg:group-hover/row:opacity-100"
        >
          {removing || collapsing ? <Spinner size={14} /> : <TrashIcon size={15} />}
        </button>
      </div>
    </article>
    </div>
    </div>
  );
}
