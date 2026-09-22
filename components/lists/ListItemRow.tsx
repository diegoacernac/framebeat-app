"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { StarRating } from "../ratings/StarRatings";
import { useOptimistic, useState, useTransition } from "react";
import { CheckIcon, TrashIcon } from "@phosphor-icons/react/dist/ssr";
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
        "flex gap-4 border-b py-4 transition-opacity duration-300",
        // Entrada: al añadir un ítem, solo la fila nueva se monta y se anima
        "animate-in fade-in slide-in-from-top-2 duration-300",
        optimisticCompleted && "opacity-50",
        removing && "pointer-events-none opacity-40"
      )}
      aria-busy={removing}
    >
      <Link
        href={href}
        className={cn(
          "group relative shrink-0 self-start overflow-hidden bg-muted",
          isPortrait ? "w-14 aspect-[2/3] lg:w-16" : "size-14 lg:size-16"
        )}
      >
        {posterUrl ? (
          <Image
            src={posterUrl}
            alt={title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="64px"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            —
          </div>
        )}
      </Link>

      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
          <Link href={href} className="font-medium leading-snug hover:underline">
            {title}
            {year && (
              <span className="ml-2 text-sm font-normal tabular-nums text-muted-foreground">{year}</span>
            )}
          </Link>
          {averageStars !== null && (
            <span className="shrink-0 text-sm font-medium text-amber-500">
              ★ {averageStars.toFixed(1)}
            </span>
          )}
        </div>

        {memberRatings.length > 0 ? (
          <div className="space-y-1.5">
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {memberRatings.map((r) => (
                <div key={r.userId} className="flex items-center gap-1.5">
                  <Link
                    href={`/u/${r.username}`}
                    className="text-xs font-medium hover:underline"
                  >
                    @{r.username}
                  </Link>
                  <StarRating value={r.stars} readOnly size={11} />
                </div>
              ))}
            </div>
            {memberRatings.some((r) => r.review) && (
              <div className="space-y-0.5">
                {memberRatings.filter((r) => r.review).map((r) => (
                  <p key={r.userId} className="text-xs text-muted-foreground line-clamp-1">
                    <span className="font-medium">@{r.username}:</span> {r.review}
                  </p>
                ))}
              </div>
            )}
          </div>
        ) : null /* Sin calificaciones no mostramos nada: repetido en cada fila era ruido */}

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Button
            type="button"
            size="sm"
            variant={optimisticCompleted ? "secondary" : "outline"}
            onClick={toggleCompleted}
            className="h-7 text-xs"
          >
            {optimisticCompleted ? (
              // key distinta → React re-monta el span y la animación vuelve a correr
              <span key="done" className="flex items-center gap-1 animate-in zoom-in-75 fade-in duration-200">
                <CheckIcon size={12} weight="bold" className="text-amber-500" /> Vista
              </span>
            ) : (
              <span key="todo" className="animate-in fade-in duration-200">Marcar como vista</span>
            )}
          </Button>
          {!myRating && (
            <Button size="sm" variant="ghost" asChild className="h-7 text-xs">
              <Link href={href}>Calificar →</Link>
            </Button>
          )}

          {/* Solo ícono: es una acción secundaria y el texto en cada fila recargaba */}
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            onClick={removeItem}
            disabled={removing}
            aria-label={`Quitar "${title}" de la lista`}
            title="Quitar de la lista"
            className="ml-auto text-muted-foreground hover:text-destructive"
          >
            {removing || collapsing ? <Spinner size={14} /> : <TrashIcon size={16} />}
          </Button>
        </div>
      </div>
    </article>
    </div>
    </div>
  );
}
