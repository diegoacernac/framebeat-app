import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main
      role="status"
      aria-label="Cargando álbum"
      className="mx-auto w-full max-w-4xl flex-1 p-8"
    >
      <div className="flex flex-col gap-8 md:flex-row">
        {/* Portada: mismo 300x300 que el <Image> real */}
        <Skeleton className="size-[300px] max-w-full shrink-0" />
        <div className="flex-1 space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-9 w-2/3" />
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-4 w-12" />
          </div>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-40" />
        </div>
      </div>

      <section className="mt-10 space-y-4">
        <Skeleton className="h-7 w-32" />
        <div className="divide-y">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <Skeleton className="h-4" style={{ width: `${40 + ((i * 17) % 35)}%` }} />
              <Skeleton className="h-4 w-10" />
            </div>
          ))}
        </div>
      </section>
      <span className="sr-only">Cargando…</span>
    </main>
  );
}
