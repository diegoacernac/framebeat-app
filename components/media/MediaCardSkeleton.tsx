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
          <div className="h-3 w-3/4 bg-muted" />
          <div className="h-2 w-1/2 bg-muted" />
        </div>
      ))}
    </>
  );
}
