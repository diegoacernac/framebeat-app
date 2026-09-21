import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main
      role="status"
      aria-label="Cargando listas"
      className="mx-auto w-full max-w-2xl flex-1 space-y-6 p-4 sm:p-8"
    >
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-9 w-28" />
      </div>

      <ul className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <li key={i} className="space-y-3 border p-4">
            {/* Miniaturas de pósters */}
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, j) => (
                <Skeleton key={j} className="aspect-[2/3] w-10" />
              ))}
            </div>
            <Skeleton className="h-4 w-1/2" />
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-0.5 w-full" />
            </div>
          </li>
        ))}
      </ul>
      <span className="sr-only">Cargando…</span>
    </main>
  );
}
