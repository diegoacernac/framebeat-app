import { Skeleton } from "@/components/ui/skeleton";
import { PosterRowSkeleton } from "@/components/media/PosterRowSkeleton";

// Misma estructura que la página: cabecera tipo playlist (portada, título,
// datos, acciones), filas numeradas y en web la columna lateral con tarjetas
export default function Loading() {
  return (
    <main
      role="status"
      aria-label="Cargando lista"
      className="mx-auto w-full max-w-4xl flex-1 space-y-8 p-4 sm:p-8 lg:max-w-6xl"
    >
      <div className="space-y-6 pt-2">
        <Skeleton className="h-3 w-20" />
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:gap-7">
          <Skeleton className="aspect-square w-32 shrink-0 sm:w-44 lg:w-52" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-10 w-2/3 sm:h-14" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
        <Skeleton className="h-1 w-full" />
        <div className="flex items-center gap-3">
          <Skeleton className="size-12 rounded-full" />
          <Skeleton className="h-4 w-28" />
        </div>
      </div>

      <div className="space-y-8 lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-12 lg:space-y-0">
        <div className="min-w-0 space-y-8">
          <div className="space-y-1">
            <Skeleton className="mb-3 h-3 w-24" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 border-b px-2 py-2.5 sm:gap-4">
                <Skeleton className="h-4 w-5" />
                <Skeleton className="aspect-[2/3] w-11 shrink-0 lg:w-12" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="size-9 rounded-full" />
                <Skeleton className="size-9 rounded-full" />
              </div>
            ))}
          </div>
          <div className="space-y-4 border-t pt-6">
            <Skeleton className="h-4 w-28" />
            <PosterRowSkeleton />
          </div>
        </div>

        <aside className="space-y-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-36" />
        </aside>
      </div>
      <span className="sr-only">Cargando…</span>
    </main>
  );
}
