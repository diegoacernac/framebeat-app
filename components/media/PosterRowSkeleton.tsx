import { Skeleton } from "@/components/ui/skeleton";

// Esqueleto de una fila horizontal de tarjetas (sugerencias de listas,
// reparto): mismos anchos que las tarjetas reales, título y fila cortada
// en el borde como la de verdad.
export function PosterRowSkeleton({
  count = 8,
  title = true,
}: {
  count?: number;
  title?: boolean;
}) {
  return (
    <div className="space-y-2">
      {title && <Skeleton className="h-4 w-48" />}
      <div className="-mx-4 flex gap-3 overflow-hidden px-4 sm:mx-0 sm:px-0">
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className="w-28 shrink-0 space-y-2 sm:w-32 lg:w-36">
            <Skeleton className="aspect-[2/3]" style={{ animationDelay: `${i * 50}ms` }} />
            <Skeleton className="h-3.5 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}
