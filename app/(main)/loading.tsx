import { Skeleton } from "@/components/ui/skeleton";
import { MediaCardSkeleton } from "@/components/media/MediaCardSkeleton";

// Inicio: pestañas, buscador, "Populares ahora" y la grilla (mismas columnas
// que MediaSearch), luego la actividad reciente en dos columnas en web.
export default function Loading() {
  return (
    <main
      role="status"
      aria-label="Cargando inicio"
      className="mx-auto w-full max-w-4xl flex-1 space-y-10 p-4 sm:p-8 lg:max-w-6xl"
    >
      <div className="space-y-6">
        <Skeleton className="h-9 w-full max-w-md" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-3 w-28" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 lg:gap-5">
          <MediaCardSkeleton count={10} />
        </div>
      </div>
      <span className="sr-only">Cargando…</span>
    </main>
  );
}
