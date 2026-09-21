import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main
      role="status"
      aria-label="Cargando lista"
      className="mx-auto w-full max-w-2xl flex-1 space-y-8 p-4 sm:p-8"
    >
      <div className="space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>

      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-1 w-full rounded-full" />
      </div>

      <section>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-4 border-b py-4">
            <Skeleton className="aspect-[2/3] w-14 shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-40" />
              <Skeleton className="h-7 w-32" />
            </div>
          </div>
        ))}
      </section>
      <span className="sr-only">Cargando…</span>
    </main>
  );
}
