import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main
      role="status"
      aria-label="Cargando formulario"
      className="mx-auto w-full max-w-lg flex-1 space-y-6 p-8"
    >
      <Skeleton className="h-8 w-40" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-14" />
        <Skeleton className="h-9 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-20 w-full" />
      </div>
      <Skeleton className="h-8 w-28" />
      <span className="sr-only">Cargando…</span>
    </main>
  );
}
