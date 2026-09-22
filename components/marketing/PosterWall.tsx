import Image from "next/image";
import { cn } from "@/lib/utils";

// Muro de pósters decorativo (portada y login): una grilla inclinada que se
// desvanece hacia los bordes. aria-hidden y prioridad baja: es ambiente, no
// contenido, así no compite con el LCP.
export function PosterWall({
  posters,
  className,
  // Columnas según el ancho del contenedor: a pantalla completa 10, en un
  // panel lateral bastan 4 (si no, quedan pocas filas y no se llena)
  gridClassName = "grid-cols-5 sm:grid-cols-6 lg:grid-cols-10",
}: {
  posters: string[];
  className?: string;
  gridClassName?: string;
}) {
  if (posters.length === 0) return null;
  // Repetimos hasta llenar la grilla aunque TMDB devuelva pocos
  const tiles = Array.from({ length: 30 }, (_, i) => posters[i % posters.length]);

  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <div className={cn("absolute -inset-x-1/4 -top-1/4 grid -rotate-6 gap-3 opacity-35", gridClassName)}>
        {tiles.map((src, i) => (
          <div key={i} className="relative aspect-[2/3] overflow-hidden bg-muted">
            <Image
              src={src}
              alt=""
              fill
              sizes="(min-width: 1024px) 10vw, 20vw"
              fetchPriority="low"
              className="object-cover"
            />
          </div>
        ))}
      </div>
      {/* Viñeta: centro oscuro para que el texto se lea, bordes que se funden */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--background)_15%,color-mix(in_oklch,var(--background)_75%,transparent)_55%,var(--background)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />
    </div>
  );
}
