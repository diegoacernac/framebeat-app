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
  // Nota TMDB (0-10): se muestra como "★ 7.8" sobre el poster
  rating?: number;
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
}: Props) {
  return (
    <Link
      href={href}
      className={cn(
        "group block space-y-2",
        "animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-300"
      )}
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div
        className={cn(
          "relative overflow-hidden border border-transparent bg-muted transition-all duration-200",
          "group-hover:border-border group-hover:shadow-sm",
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
            className={cn(
              "object-cover transition-[transform,opacity] duration-300 group-hover:scale-105",
              // Atenuada, pero vuelve a opacidad completa al pasar el mouse
              seen && "opacity-40 group-hover:opacity-100"
            )}
            // 2 columnas en móvil, 3 en sm, 4 desde md (contenedor max-w-4xl)
            sizes="(min-width: 768px) 210px, (min-width: 640px) 33vw, 50vw"
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
        {rating !== undefined && rating > 0 && (
          <span className="absolute right-1.5 top-1.5 bg-black/75 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-amber-400">
            ★ {rating.toFixed(1)}
          </span>
        )}
        {showStars !== undefined && showStars > 0 && (
          <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/75 via-black/10 to-transparent p-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <span className="text-base text-amber-400">{"★".repeat(showStars)}</span>
          </div>
        )}
      </div>

      {/* Alto fijo (título de 2 líneas + año): con títulos largos la grilla
          no se descuadra, y el espacio sobrante queda abajo, no entre ambos */}
      <div className="min-h-14">
        <p className="line-clamp-2 text-sm font-medium transition-colors group-hover:text-foreground">{title}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
        {showStars !== undefined && showStars > 0 && (
          <p className="mt-0.5 text-xs text-yellow-600 dark:text-yellow-500">
            {"★".repeat(showStars)}
          </p>
        )}
      </div>
    </Link>
  );
}