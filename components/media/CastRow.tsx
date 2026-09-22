import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import { HorizontalScroller } from "@/components/ui/horizontal-scroller";
import { getPersonDiscoverHref } from "@/lib/discover";
import { getProfileUrl, type CastMember } from "@/lib/tmdb";

// Reparto como tarjetas de retrato (mismo formato que los pósters): foto
// grande, nombre y personaje completos. Tocar una persona lleva a
// "¿Qué vemos?" con sus películas.
export function CastRow({ cast }: { cast: CastMember[] }) {
  return (
    <HorizontalScroller arrowClassName="[--card-w:8rem] lg:[--card-w:9rem] top-[calc(var(--card-w)*0.75)]">
      {cast.map((actor) => {
        const photo = getProfileUrl(actor.profile_path, "h632");
        const initials = actor.name
          .split(" ")
          .map((word) => word[0])
          .slice(0, 2)
          .join("");
        return (
          <li key={actor.id} className="w-28 shrink-0 snap-start sm:w-32 lg:w-36">
            <Link
              href={getPersonDiscoverHref(actor.id, actor.name, "Acting")}
              title={`Ver películas de ${actor.name}`}
              className="group block space-y-2"
            >
              <div className="relative aspect-[2/3] overflow-hidden bg-muted ring-1 ring-transparent transition-shadow duration-200 group-hover:ring-foreground/30">
                {photo ? (
                  <Image
                    src={photo}
                    alt={actor.name}
                    fill
                    sizes="(min-width: 1024px) 144px, 128px"
                    className="object-cover object-top transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <span className="flex h-full items-center justify-center text-2xl font-medium text-muted-foreground">
                    {initials}
                  </span>
                )}
                {/* Al pasar el mouse: a dónde lleva */}
                <span className="absolute inset-x-0 bottom-0 flex items-center gap-1 bg-gradient-to-t from-black/90 to-transparent px-2.5 pb-2.5 pt-8 text-xs font-medium text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  Ver películas <ArrowRightIcon size={12} weight="bold" />
                </span>
              </div>
              <div>
                <p className="line-clamp-2 text-sm font-medium leading-snug transition-colors group-hover:text-amber-500">
                  {actor.name}
                </p>
                {actor.character && (
                  <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-muted-foreground">
                    {actor.character}
                  </p>
                )}
              </div>
            </Link>
          </li>
        );
      })}
    </HorizontalScroller>
  );
}
