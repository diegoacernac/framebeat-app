import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main
      role="status"
      aria-label="Cargando listas"
      className="mx-auto w-full max-w-2xl flex-1 space-y-6 p-4 sm:p-8 lg:max-w-6xl"
    >
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-9 w-28" />
      </div>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
        {Array.from({ length: 3 }).map((_, i) => (
          <li key={i} className="space-y-4 border p-4">
            {/* Tira de pósters */}
            <div className="grid grid-cols-5 gap-1">
              {Array.from({ length: 5 }).map((_, j) => (
                <Skeleton key={j} className="aspect-[2/3]" />
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
