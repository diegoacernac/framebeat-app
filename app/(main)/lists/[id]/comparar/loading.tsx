import { Skeleton } from "@/components/ui/skeleton";

// Misma estructura que "Comparar gustos": miembros, dos tarjetas y el detalle
export default function Loading() {
  return (
    <main
      role="status"
      aria-label="Cargando comparación"
      className="mx-auto w-full max-w-4xl flex-1 space-y-8 p-4 sm:p-8 lg:max-w-6xl"
    >
      <div className="space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 2 }, (_, i) => (
          <Skeleton key={i} className="h-[74px]" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-36" />
        <Skeleton className="h-36" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-3 w-32" />
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex gap-3 py-2">
            <Skeleton className="aspect-[2/3] w-10 shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        ))}
      </div>
      <span className="sr-only">Cargando…</span>
    </main>
  );
}
