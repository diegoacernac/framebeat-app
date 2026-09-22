import { cn } from "@/lib/utils";

type Props = {
  count?: number;
  aspectRatio?: "poster" | "square";
};

export function MediaCardSkeleton({
  count = 8,
  aspectRatio = "poster",
}: Props) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse space-y-2"
          style={{ animationDelay: `${i * 50}ms` }}
        >
          <div
            className={cn(
              "bg-muted",
              aspectRatio === "poster" ? "aspect-[2/3]" : "aspect-square"
            )}
          />
          {/* Mismo alto que el texto de MediaCard (min-h-14): nada salta al cargar */}
          <div className="min-h-14 space-y-2 pt-0.5">
            <div className="h-3.5 w-3/4 bg-muted" />
            <div className="h-3 w-1/3 bg-muted" />
          </div>
        </div>
      ))}
    </>
  );
}
