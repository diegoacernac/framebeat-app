"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { StarRating } from "../ratings/StarRatings";

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
  posterUrl: string | null;
  mediaType: "movie" | "album";
  externalId: string;
  averageStars: number | null;
  memberRatings: MemberRating[];
  completed: boolean;
  currentUserId: string;
};

export function ListItemRow({
  listId,
  mediaItemId,
  title,
  posterUrl,
  mediaType,
  externalId,
  averageStars,
  memberRatings,
  completed,
  currentUserId,
}: Props) {
  const router = useRouter();
  const href = mediaType === "album" ? `/albums/${externalId}` : `/movies/${externalId}`;

  async function toggleCompleted() {
    await fetch(`/api/lists/${listId}/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mediaItemId, completed: !completed }),
    });
    router.refresh();
  }

  const myRating = memberRatings.find((r) => r.userId === currentUserId);

  return (
    <article className="flex gap-4 border-b py-4">
      <Link href={href} className="relative size-16 shrink-0 overflow-hidden bg-muted">
        {posterUrl ? (
          <Image src={posterUrl} alt={title} fill className="object-cover" sizes="64px" />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            —
          </div>
        )}
      </Link>
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <Link href={href} className="font-medium hover:underline">
            {title}
          </Link>
          {averageStars !== null && (
            <span className="text-xs text-muted-foreground">
              Promedio: {averageStars.toFixed(1)} ★
            </span>
          )}
        </div>
        <div className="space-y-1">
          {memberRatings.map((r) => (
            <div key={r.userId} className="text-xs">
              <Link href={`/u/${r.username}`} className="font-medium hover:underline">
                @{r.username}
              </Link>
              {": "}
              <StarRating value={r.stars} readOnly size={14} />
              {r.review && (
                <p className="mt-0.5 text-muted-foreground line-clamp-2">{r.review}</p>
              )}
            </div>
          ))}
          {memberRatings.length === 0 && (
            <p className="text-xs text-muted-foreground">Nadie ha calificado aún.</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant={completed ? "secondary" : "outline"}
            onClick={toggleCompleted}
          >
            {completed ? "✓ Ya la vi" : "Marcar como vista"}
          </Button>
          {!myRating && (
            <Button size="sm" variant="ghost" asChild>
              <Link href={href}>Calificar</Link>
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}