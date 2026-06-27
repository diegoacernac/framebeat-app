import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

type Props = {
  href: string;
  title: string;
  subtitle?: string;
  posterUrl?: string | null;
  index?: number;
  aspectRatio?: "poster" | "square";
  showStars?: number;
};

export function MediaCard({
  href,
  title,
  subtitle,
  posterUrl,
  index = 0,
  aspectRatio = "poster",
  showStars,
}: Props) {
  return (
    <Link
      href={href}
      className={cn(
        "group block space-y-2",
        "animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-300"
      )}
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div
        className={cn(
          "relative overflow-hidden border border-transparent bg-muted transition-all duration-200",
          "group-hover:border-border group-hover:shadow-sm",
          aspectRatio === "poster" ? "aspect-[2/3]" : "aspect-square"
        )}
      >
        {posterUrl ? (
          <Image
            src={posterUrl}
            alt={title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="150px"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            Sin poster
          </div>
        )}
      </div>

      <div>
        <p className="line-clamp-2 text-sm font-medium transition-colors group-hover:text-foreground">{title}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
        {showStars !== undefined && showStars > 0 && (
          <p className="mt-0.5 text-xs text-yellow-600 dark:text-yellow-500">
            {"★".repeat(showStars)}
          </p>
        )}
      </div>
    </Link>
  );
}