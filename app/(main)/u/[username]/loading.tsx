import { Skeleton } from "@/components/ui/skeleton";
import { MediaCardSkeleton } from "@/components/media/MediaCardSkeleton";

export default function Loading() {
  return (
    <main
      role="status"
      aria-label="Cargando perfil"
      className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-4 sm:p-8 lg:max-w-6xl"
    >
      {/* Avatar + nombre */}
      <div className="flex items-center gap-4">
        <Skeleton className="size-16 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>

      <div className="space-y-6">
        {/* Números: calificaciones / promedios */}
        <div className="flex gap-6 border-b pb-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-7 w-12" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>

        {/* Pestañas + grilla de pósters (reusa el esqueleto de tarjeta) */}
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 lg:gap-5">
          <MediaCardSkeleton count={10} />
        </div>
      </div>
      <span className="sr-only">Cargando…</span>
    </main>
  );
}
