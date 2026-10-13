import Image from "next/image";
import Link from "next/link";
import { FilmStripIcon } from "@phosphor-icons/react/dist/ssr";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SectionLabel } from "@/components/ui/section-label";
import { cn } from "@/lib/utils";

type Member = { userId: string; username: string; avatarUrl: string | null };

// Cabecera de una lista, estilo playlist de Spotify: portada (mosaico con los
// primeros pósters), título grande, descripción y una línea de datos. De fondo,
// el primer póster muy desenfocado tiñe la cabecera con los colores de la
// lista (lo que Spotify hace con el color de la portada).
export function ListHero({
  title,
  description,
  posters,
  members,
  totalCount,
  completedCount,
  averageStars,
  backHref,
  children,
}: {
  // "← Mis listas", dentro de la cabecera (sobre el fondo)
  backHref?: string;
  title: string;
  description: string | null;
  posters: (string | null)[];
  members: Member[];
  totalCount: number;
  completedCount: number;
  averageStars: number | null;
  // Barra de acciones (elegir al azar, comparar, añadir, invitar)
  children?: React.ReactNode;
}) {
  const cover = posters.filter((p): p is string => Boolean(p)).slice(0, 4);
  const progressPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <section className="relative isolate -mx-4 -mt-4 overflow-hidden px-4 pb-6 pt-6 sm:-mx-8 sm:-mt-8 sm:px-8 sm:pt-8">
      {/* Fondo: primer póster desenfocado + degradado hacia el fondo de la página */}
      {cover[0] && (
        // La máscara funde los bordes laterales con la página: sin ella el
        // fondo se ve como una caja
        <div
          aria-hidden
          // Elipse centrada en la portada: se desvanece hacia todos los bordes
          // (antes el borde de arriba se veía como un corte duro)
          className="absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_75%_85%_at_25%_35%,black_30%,transparent_100%)]"
        >
          <Image src={cover[0]} alt="" fill sizes="50vw" className="scale-125 object-cover opacity-35 blur-3xl saturate-150" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/70 to-background" />
        </div>
      )}

      {backHref && (
        <Link href={backHref} className="mb-6 inline-block text-xs text-muted-foreground transition-colors hover:text-foreground">
          ← Mis listas
        </Link>
      )}

      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:gap-7">
        <ListCover posters={cover} />

        <div className="min-w-0 flex-1 space-y-3">
          <SectionLabel as="p">{members.length > 1 ? "Lista compartida" : "Lista"}</SectionLabel>
          <h1 className="text-3xl font-semibold leading-none tracking-tight text-balance sm:text-5xl lg:text-6xl">
            {title}
          </h1>
          {description && (
            <p className="max-w-[68ch] font-sans text-[15px] text-muted-foreground">{description}</p>
          )}

          {/* Línea de datos: miembros · títulos · vistas · promedio */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
            <span className="flex -space-x-1.5">
              {members.slice(0, 4).map((m) => (
                <Avatar key={m.userId} className="size-6 ring-2 ring-background">
                  {m.avatarUrl && <AvatarImage src={m.avatarUrl} alt={`@${m.username}`} />}
                  <AvatarFallback className="text-[10px]">{m.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
              ))}
            </span>
            <span className="font-medium text-foreground">
              @{members[0]?.username}
              {members.length > 1 && <span className="font-normal text-muted-foreground"> y {members.length - 1} más</span>}
            </span>
            <span aria-hidden>·</span>
            <span>
              {totalCount} {totalCount === 1 ? "título" : "títulos"}
            </span>
            {totalCount > 0 && (
              <>
                <span aria-hidden>·</span>
                <span>
                  {completedCount}/{totalCount} vistas
                </span>
              </>
            )}
            {averageStars !== null && (
              <>
                <span aria-hidden>·</span>
                <span className="text-primary">★ {averageStars.toFixed(1)}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {totalCount > 0 && (
        <div className="mt-6 h-1 w-full overflow-hidden bg-foreground/10" aria-label={`${completedCount} de ${totalCount} vistas`}>
          <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progressPct}%` }} />
        </div>
      )}

      {children && <div className="mt-5">{children}</div>}
    </section>
  );
}

// Portada: 4 pósters en mosaico; con menos, el primero a pantalla completa;
// sin ninguno, un ícono sobre fondo apagado
function ListCover({ posters }: { posters: string[] }) {
  return (
    <div className="relative aspect-square w-32 shrink-0 overflow-hidden bg-muted shadow-2xl ring-1 ring-white/10 sm:w-44 lg:w-52">
      {posters.length === 0 ? (
        <div className="flex size-full items-center justify-center text-muted-foreground">
          <FilmStripIcon size={40} />
        </div>
      ) : (
        <div className={cn("grid size-full", posters.length >= 4 && "grid-cols-2 grid-rows-2")}>
          {(posters.length >= 4 ? posters : posters.slice(0, 1)).map((src) => (
            <div key={src} className="relative overflow-hidden">
              <Image src={src} alt="" fill sizes="(min-width: 1024px) 104px, 88px" className="object-cover" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
