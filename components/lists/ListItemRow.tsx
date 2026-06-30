"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { StarRating } from "../ratings/StarRatings";
import { cn } from "@/lib/utils";

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
  mediaType: "movie" | "album" | "tv";
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
  const href =
    mediaType === "album"
      ? `/albums/${externalId}`
      : mediaType === "tv"
        ? `/series/${externalId}`
        : `/movies/${externalId}`;

  async function toggleCompleted() {
    await fetch(`/api/lists/${listId}/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mediaItemId, completed: !completed }),
    });
    router.refresh();
  }

  const myRating = memberRatings.find((r) => r.userId === currentUserId);
  const isPortrait = mediaType !== "album";

  return (
    <article
      className={cn(
        "flex gap-4 border-b py-4 transition-opacity",
        completed && "opacity-50"
      )}
    >
      <Link
        href={href}
        className={cn(
          "group relative shrink-0 self-start overflow-hidden bg-muted",
          isPortrait ? "w-14 aspect-[2/3]" : "size-14"
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
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            —
          </div>
        )}
      </Link>

      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
          <Link href={href} className="font-medium hover:underline leading-snug">
            {title}
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
        ) : (
          <p className="text-xs text-muted-foreground">Nadie ha calificado aún.</p>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Button
            type="button"
            size="sm"
            variant={completed ? "secondary" : "outline"}
            onClick={toggleCompleted}
            className="h-7 text-xs"
          >
            {completed ? "✓ Vista" : "Marcar como vista"}
          </Button>
          {!myRating && (
            <Button size="sm" variant="ghost" asChild className="h-7 text-xs">
              <Link href={href}>Calificar →</Link>
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
