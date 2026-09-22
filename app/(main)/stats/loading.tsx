import { Skeleton } from "@/components/ui/skeleton";
import { MediaCardSkeleton } from "@/components/media/MediaCardSkeleton";

export default function Loading() {
  return (
    <main
      role="status"
      aria-label="Cargando estadísticas"
      className="mx-auto w-full max-w-4xl flex-1 space-y-8 p-4 sm:p-8 lg:max-w-6xl"
    >
      <Skeleton className="h-8 w-40" />

      {/* Tú / Tu pareja / En común */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <Skeleton className="h-44" />
        <Skeleton className="h-44 lg:col-span-2" />
      </div>

      {/* La más polémica */}
      <Skeleton className="h-40" />

      {/* Favoritas (una columna por persona en web) */}
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        {[0, 1].map((col) => (
          <div key={col} className="space-y-3">
            <Skeleton className="h-3 w-40" />
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              <MediaCardSkeleton count={3} />
            </div>
          </div>
        ))}
      </div>

      <span className="sr-only">Cargando…</span>
    </main>
  );
}
