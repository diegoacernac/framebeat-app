import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main
      role="status"
      aria-label="Cargando estadísticas"
      className="mx-auto w-full max-w-4xl flex-1 p-4 sm:p-8"
    >
      <Skeleton className="mb-8 h-8 w-40" />

      {/* Tú / Tu pareja */}
      <div className="mb-4 grid grid-cols-2 gap-4">
        <Skeleton className="h-44 rounded-lg" />
        <Skeleton className="h-44 rounded-lg" />
      </div>

      {/* Vistas por los dos */}
      <Skeleton className="mb-8 h-28 rounded-lg" />

      {/* La más polémica */}
      <Skeleton className="mb-8 h-36 rounded-lg" />

      <span className="sr-only">Cargando…</span>
    </main>
  );
}
