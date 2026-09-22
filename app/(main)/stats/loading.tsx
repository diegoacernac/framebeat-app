import { Skeleton } from "@/components/ui/skeleton";
import { MediaCardSkeleton } from "@/components/media/MediaCardSkeleton";

// Misma estructura que la página: 4 números, reparto de notas y favoritas
export default function Loading() {
  return (
    <main
      role="status"
      aria-label="Cargando estadísticas"
      className="mx-auto w-full max-w-4xl flex-1 space-y-8 p-4 sm:p-8 lg:max-w-6xl"
    >
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>

      <Skeleton className="h-44" />

      <div className="space-y-3">
        <Skeleton className="h-3 w-28" />
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4 lg:grid-cols-6 lg:gap-5">
          <MediaCardSkeleton count={6} />
        </div>
      </div>
      <span className="sr-only">Cargando…</span>
    </main>
  );
}
