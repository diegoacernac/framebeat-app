import Image from "next/image";
import type { ReactNode } from "react";

// Cabecera de las fichas de película y serie.
// - Web: el backdrop cubre toda la cabecera; póster y datos van encima,
//   con un degradado lateral para que el texto se lea.
// - Móvil: backdrop arriba y, montado sobre su borde, un póster chico al lado
//   del título, así se sabe qué película es sin hacer scroll. La sinopsis y
//   las acciones van debajo a todo el ancho.
// Mientras cargan las imágenes se ve un brillo gris, no un hueco negro.
// (Sin fade de opacidad en las imágenes: retrasaría el LCP.)
export function DetailHero({
  title,
  backdropUrl,
  posterUrl,
  head,
  children,
}: {
  title: string;
  backdropUrl: string | null;
  posterUrl: string | null;
  // Título, tagline, año/duración/nota, director
  head: ReactNode;
  // Géneros, sinopsis y acciones
  children: ReactNode;
}) {
  return (
    <section className="relative isolate">
      {/* Backdrop: franja arriba en móvil, fondo de toda la cabecera en web */}
      <div className="absolute inset-x-0 top-0 -z-10 h-56 overflow-hidden sm:h-72 md:h-full">
        {backdropUrl && (
          <>
            <div className="absolute inset-0 animate-pulse bg-muted/40" />
            <Image
              src={backdropUrl}
              alt=""
              fill
              sizes="100vw"
              className="object-cover object-top md:object-[center_25%]"
              // Es el LCP: se pide primero (priority está deprecado en Next 16)
              loading="eager"
              fetchPriority="high"
            />
          </>
        )}
        {/* Degradados: hacia abajo siempre; en web también desde la izquierda */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/10" />
        <div className="absolute inset-0 hidden bg-gradient-to-r from-background via-background/80 to-background/10 md:block" />
      </div>

      <div className="mx-auto grid max-w-4xl grid-cols-[6.5rem_minmax(0,1fr)] gap-x-4 gap-y-5 px-4 pt-36 sm:grid-cols-[8rem_minmax(0,1fr)] sm:px-8 sm:pt-44 md:grid-cols-[220px_minmax(0,1fr)] md:gap-x-10 md:pb-12 md:pt-28 lg:max-w-6xl">
        {/* Póster: en web ocupa las dos filas (datos + sinopsis) */}
        <div className="relative aspect-[2/3] self-start overflow-hidden bg-muted shadow-2xl ring-1 ring-white/10 md:row-span-2">
          {posterUrl && (
            <>
              <div className="absolute inset-0 animate-pulse bg-foreground/5" />
              <Image
                src={posterUrl}
                alt={title}
                fill
                sizes="(min-width: 768px) 220px, 128px"
                className="object-cover"
              />
            </>
          )}
        </div>

        {/* En móvil los datos se alinean abajo, junto al borde del póster */}
        <div className="min-w-0 space-y-1.5 self-end md:self-start md:space-y-2 md:pt-4">{head}</div>

        {/* En móvil a todo el ancho; en web en la columna de los datos */}
        <div className="col-span-2 space-y-4 md:col-span-1 md:col-start-2">{children}</div>
      </div>
    </section>
  );
}
