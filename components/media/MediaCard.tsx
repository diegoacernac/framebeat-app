import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

type Props = {
  href: string;
  title: string;
  subtitle?: string;
  posterUrl?: string | null;
  index?: number;
  aspectRatio?: "poster" | "square";
  showStars?: number;
  // Marca "✓ Vista" (en ¿Qué vemos?: alguno de los dos ya la vio)
  seen?: boolean;
  // Nota TMDB (0-10): "★ 7.8" junto al año
  rating?: number;
  // Con sinopsis, al pasar el mouse se muestra el título completo, año, nota
  // y sinopsis sobre el poster (mismo formato que las sugerencias de listas)
  overview?: string;
  // Primera fila visible: carga inmediata y prioritaria (es el LCP de la
  // página). El resto sigue en lazy.
  eager?: boolean;
};

export function MediaCard({
  href,
  title,
  subtitle,
  posterUrl,
  index = 0,
  aspectRatio = "poster",
  showStars,
  seen = false,
  rating,
  overview,
  eager = false,
}: Props) {
  const hasRating = rating !== undefined && rating > 0;

  return (
    <Link
      href={href}
      className={cn(
        "group block space-y-2",
        // La primera fila (eager) aparece sin animación: arrancar en opacidad 0
        // retrasa el LCP. El resto entra escalonado.
        !eager && "animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-300"
      )}
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div
        className={cn(
          "relative overflow-hidden bg-muted ring-1 ring-transparent transition-shadow duration-200",
          "group-hover:ring-foreground/30",
          aspectRatio === "poster" ? "aspect-[2/3]" : "aspect-square"
        )}
      >
        {posterUrl ? (
          <>
          {/* Shimmer mientras carga el poster (lazy): la imagen lo tapa al llegar */}
          <div className="absolute inset-0 animate-pulse bg-foreground/5" />
          <Image
            src={posterUrl}
            alt={title}
            fill
            loading={eager ? "eager" : "lazy"}
            // Prioridad alta solo para las 2 primeras (la fila visible en
            // móvil): con más, en redes lentas compiten con el CSS y retrasan
            // el primer pintado
            fetchPriority={eager && index < 2 ? "high" : "auto"}
            className={cn(
              "object-cover transition-[transform,opacity] duration-300 group-hover:scale-105",
              // Atenuada, pero vuelve a opacidad completa al pasar el mouse
              seen && "opacity-40 group-hover:opacity-100"
            )}
            // 2 columnas en móvil, 3 en sm, 4 en md, 5 desde lg (max-w-6xl)
            sizes="(min-width: 1024px) 220px, (min-width: 768px) 25vw, (min-width: 640px) 33vw, 50vw"
          />
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            Sin poster
          </div>
        )}
        {seen && (
          <span className="absolute left-1.5 top-1.5 flex items-center gap-0.5 bg-black/75 px-1.5 py-0.5 text-[10px] font-medium text-amber-400">
            ✓ Vista
          </span>
        )}
        {overview !== undefined && (
          <div className="absolute inset-0 flex flex-col justify-end gap-1 bg-gradient-to-t from-black via-black/80 to-black/10 p-3 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <span className="text-sm font-medium leading-snug">{title}</span>
            <span className="flex items-center gap-2 text-xs text-white/70">
              {subtitle}
              {hasRating && <span className="text-amber-400">★ {rating.toFixed(1)}</span>}
            </span>
            {overview && (
              <span className="line-clamp-5 text-xs leading-snug text-white/70">{overview}</span>
            )}
          </div>
        )}
        {/* Calificaciones (perfil): al pasar el mouse, título completo y estrellas */}
        {overview === undefined && showStars !== undefined && showStars > 0 && (
          <div className="absolute inset-0 flex flex-col justify-end gap-1 bg-gradient-to-t from-black via-black/60 to-transparent p-3 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <span className="text-sm font-medium leading-snug">{title}</span>
            {subtitle && <span className="text-xs text-white/70">{subtitle}</span>}
            <span className="text-base text-amber-400">{"★".repeat(showStars)}</span>
          </div>
        )}
      </div>

      {/* Alto fijo (título de 2 líneas + año): con títulos largos la grilla
          no se descuadra, y el espacio sobrante queda abajo, no entre ambos */}
      <div className="min-h-14" title={title}>
        <p className="line-clamp-2 text-sm font-medium transition-colors group-hover:text-foreground">{title}</p>
        {(subtitle || hasRating) && (
          <p className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
            {subtitle}
            {hasRating && <span className="tabular-nums text-amber-500/90">★ {rating.toFixed(1)}</span>}
          </p>
        )}
        {showStars !== undefined && showStars > 0 && (
          // Las 5 estrellas (vacías en gris): se lee "4 de 5" de un vistazo
          <p className="mt-1 text-sm leading-none tracking-wider" aria-label={`${showStars} de 5 estrellas`}>
            <span className="text-amber-500">{"★".repeat(showStars)}</span>
            <span className="text-foreground/20">{"★".repeat(5 - showStars)}</span>
          </p>
        )}
      </div>
    </Link>
  );
}