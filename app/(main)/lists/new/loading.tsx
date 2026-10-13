import { Skeleton } from "@/components/ui/skeleton";

// Misma estructura que el formulario: editor a la izquierda, vista previa a
// la derecha (debajo en móvil)
export default function Loading() {
  return (
    <main
      role="status"
      aria-label="Cargando formulario"
      className="mx-auto grid w-full max-w-4xl flex-1 gap-10 p-4 pt-8 sm:p-8 sm:pt-12 lg:max-w-6xl lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-14"
    >
      <div className="space-y-6">
        <div className="space-y-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-10 w-3/4 sm:h-14" />
          <Skeleton className="h-5 w-2/3" />
        </div>
        <div className="flex flex-wrap gap-2 border-t pt-6">
          {[150, 90, 130, 140, 160, 170].map((w, i) => (
            <Skeleton key={i} className="h-7" style={{ width: w }} />
          ))}
        </div>
        <Skeleton className="h-9 w-32" />
      </div>
      <Skeleton className="h-48" />
      <span className="sr-only">Cargando…</span>
    </main>
  );
}
