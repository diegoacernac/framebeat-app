import { Skeleton } from "@/components/ui/skeleton";
import { PosterRowSkeleton } from "@/components/media/PosterRowSkeleton";

// Misma estructura que la página: encabezado, y en web dos columnas
// (lista + sugerencias | añadir + miembros)
export default function Loading() {
  return (
    <main
      role="status"
      aria-label="Cargando lista"
      className="mx-auto w-full max-w-2xl flex-1 space-y-8 p-4 sm:p-8 lg:max-w-6xl"
    >
      <div className="space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-8 w-2/3 max-w-md" />
        <Skeleton className="h-4 w-1/2 max-w-sm" />
      </div>

      <div className="space-y-8 lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-12 lg:space-y-0">
        <div className="min-w-0 space-y-8">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-1 w-full rounded-full" />
          </div>

          <section className="space-y-3">
            <Skeleton className="h-4 w-28" />
            <div>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-4 border-b py-4">
                  <Skeleton className="aspect-[2/3] w-14 shrink-0 lg:w-16" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-40" />
                    <Skeleton className="h-7 w-36" />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="space-y-4 border-t pt-6">
            <Skeleton className="h-4 w-28" />
            <PosterRowSkeleton />
          </div>
        </div>

        <aside className="space-y-8 border-t pt-6 lg:border-t-0 lg:pt-0">
          {["Añadir película", "Añadir serie"].map((label) => (
            <div key={label} className="space-y-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-9 w-full" />
            </div>
          ))}
          <div className="space-y-3">
            <Skeleton className="h-4 w-24" />
            <div className="flex gap-3">
              <Skeleton className="size-7 rounded-full" />
              <Skeleton className="h-7 w-24" />
            </div>
          </div>
        </aside>
      </div>
      <span className="sr-only">Cargando…</span>
    </main>
  );
}
