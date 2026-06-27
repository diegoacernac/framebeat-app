import Image from "next/image";
import Link from "next/link";
import { StarRating } from "@/components/ratings/StarRatings";
import { cn } from "@/lib/utils";

type Props = {
  username: string;
  title: string;
  href: string;
  mediaType: "movie" | "album";
  stars: number;
  review: string | null;
  posterUrl: string | null;
  index?: number;
};

export function FeedReviewCard({
  username,
  title,
  href,
  mediaType,
  stars,
  review,
  posterUrl,
  index = 0,
}: Props) {
  const label = mediaType === "album" ? "Álbum" : "Película";

  return (
    <article
      className={cn(
        "flex gap-4 border-b pb-4",
        "animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-300"
      )}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <Link
        href={href}
        className="group relative size-16 shrink-0 overflow-hidden bg-muted"
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
          <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">
            —
          </div>
        )}
      </Link>

      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm">
          <Link
            href={`/u/${username}`}
            className="font-medium hover:underline"
          >
            @{username}
          </Link>
          <span className="text-muted-foreground"> calificó </span>
          <span
            className={cn(
              "text-[10px] uppercase tracking-wider",
              mediaType === "album"
                ? "text-violet-600 dark:text-violet-400"
                : "text-amber-600 dark:text-amber-400"
            )}
          >
            {label}
          </span>
        </p>

        <Link href={href} className="block font-medium hover:underline">
          {title}
        </Link>

        <StarRating value={stars} readOnly size={16} />

        {review && (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {review}
          </p>
        )}
      </div>
    </article>
  );
}