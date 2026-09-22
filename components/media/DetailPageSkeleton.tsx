import { Skeleton } from "@/components/ui/skeleton";
import { PosterRowSkeleton } from "./PosterRowSkeleton";

// Imita la estructura de /movies/[id] y /series/[id] con las MISMAS medidas,
// así al llegar el contenido real nada salta de lugar.
export function DetailPageSkeleton() {
  return (
    <div role="status" aria-label="Cargando">
      {/* Backdrop */}
      <Skeleton className="h-48 w-full md:h-64" />

      <main className="mx-auto w-full max-w-4xl flex-1 p-4 sm:p-8 lg:max-w-6xl">
        <div className="flex flex-col gap-8 md:flex-row">
          {/* Póster: mismo 200x300 que el <Image> real */}
          <Skeleton className="h-[300px] w-[200px] shrink-0 rounded-sm" />

          <div className="flex-1 space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-9 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-40" />
            </div>

            {/* Géneros: anchos por style porque Tailwind no genera clases dinámicas */}
            <div className="flex gap-2">
              {[64, 80, 56].map((w, i) => (
                <Skeleton key={i} className="h-5" style={{ width: w }} />
              ))}
            </div>

            {/* Sinopsis: líneas de distinto largo para que parezca texto */}
            <div className="space-y-2">
              {["w-full", "w-full", "w-11/12", "w-4/5"].map((w, i) => (
                <Skeleton key={i} className={`h-3.5 ${w}`} />
              ))}
            </div>
          </div>
        </div>

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
