import { Skeleton } from "@/components/ui/skeleton";
import { PosterRowSkeleton } from "./PosterRowSkeleton";

// Imita la estructura de /movies/[id] y /series/[id] con las MISMAS medidas,
// así al llegar el contenido real nada salta de lugar.
export function DetailPageSkeleton() {
  return (
    <div role="status" aria-label="Cargando">
      {/* Cabecera: mismas medidas que DetailHero (backdrop + póster + datos) */}
      <section className="relative isolate">
        <Skeleton className="absolute inset-x-0 top-0 -z-10 h-56 sm:h-72 md:h-full" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-background via-background/70 to-transparent" />
        <div className="mx-auto grid max-w-4xl grid-cols-[6.5rem_minmax(0,1fr)] gap-x-4 gap-y-5 px-4 pt-36 sm:grid-cols-[8rem_minmax(0,1fr)] sm:px-8 sm:pt-44 md:grid-cols-[220px_minmax(0,1fr)] md:gap-x-10 md:pb-12 md:pt-28 lg:max-w-6xl">
          <Skeleton className="aspect-[2/3] self-start md:row-span-2" />
          <div className="space-y-2 self-end md:self-start md:pt-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-40" />
          </div>
          <div className="col-span-2 space-y-4 md:col-span-1 md:col-start-2">
            {/* Géneros: anchos por style porque Tailwind no genera clases dinámicas */}
            <div className="flex gap-2">
              {[64, 80, 56].map((w, i) => (
                <Skeleton key={i} className="h-5" style={{ width: w }} />
              ))}
            </div>
            <div className="space-y-2">
              {["w-full", "w-full", "w-11/12", "w-4/5"].map((w, i) => (
                <Skeleton key={i} className={`h-3.5 ${w}`} />
              ))}
            </div>
            <Skeleton className="h-8 w-44" />
          </div>
        </div>
      </section>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 pb-8 sm:px-8 lg:max-w-6xl">
        {/* Dónde ver */}
        <section className="mt-8 space-y-4">
          <Skeleton className="h-6 w-44" />
          <div className="flex gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-28" />
            ))}
          </div>
        </section>

        {/* Reparto: tarjetas de retrato, igual que CastRow */}
        <section className="mt-8">
          <Skeleton className="mb-4 h-3 w-16" />
          <PosterRowSkeleton title={false} />
        </section>

        <span className="sr-only">Cargando…</span>
      </main>
    </div>
  );
}
