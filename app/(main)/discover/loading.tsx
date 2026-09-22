import { Skeleton } from "@/components/ui/skeleton";
import { MediaCardSkeleton } from "@/components/media/MediaCardSkeleton";

// ¿Qué vemos?: título, Películas/Series + botón de filtros, resumen de lo
// aplicado, contador y la grilla (mismas columnas que DiscoverResults)
export default function Loading() {
  return (
    <main
      role="status"
      aria-label="Cargando resultados"
      className="mx-auto w-full max-w-4xl flex-1 space-y-8 p-4 sm:p-8 lg:max-w-6xl"
    >
      <Skeleton className="h-8 w-40" />

      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-56" />
          <Skeleton className="ml-auto h-9 w-28" />
        </div>
        <Skeleton className="h-4 w-48" />
      </div>

      <div className="space-y-6">
        <Skeleton className="h-3 w-36" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 lg:gap-5">
          <MediaCardSkeleton count={10} />
        </div>
      </div>
      <span className="sr-only">Cargando…</span>
    </main>
  );
}
