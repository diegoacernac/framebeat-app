import Image from "next/image";
import {
  getProviderLogoUrl,
  type WatchProvider,
  type WatchProvidersByCountry,
} from "@/lib/tmdb";
import { getProviderLink } from "@/lib/watchLinks";

function ProviderList({
  title,
  providers,
  mediaTitle,
  aggregateLink,
}: {
  title: string;
  providers: WatchProvider[];
  mediaTitle: string;
  aggregateLink: string;
}) {
  if (!providers.length) return null;

  const sorted = [...providers].sort(
    (a, b) => a.display_priority - b.display_priority
  );

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>

      <div className="flex flex-wrap gap-2">
        {sorted.map((p) => {
          const logo = getProviderLogoUrl(p.logo_path);
          const href = getProviderLink(p.provider_id, mediaTitle, aggregateLink);
          return (
            <a
              key={p.provider_id}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 border px-2 py-1 text-xs transition-colors hover:border-amber-500 hover:text-amber-500"
              title={`Ver en ${p.provider_name}`}
            >
              {logo && (
                <Image
                  src={logo}
                  // El nombre ya va al lado en texto: el logo es decorativo
                  alt=""
                  width={20}
                  height={20}
                  className="rounded-sm"
                />
              )}
              <span>{p.provider_name}</span>
            </a>
          );
        })}
      </div>
    </div>
  );
}

export function WatchProviders({
  providers,
  title,
}: {
  providers: WatchProvidersByCountry | null;
  title: string;
}) {
  if (!providers) {
    return (
      <p className="text-sm text-muted-foreground">
        No hay datos de streaming para Perú.
      </p>
    );
  }

  const hasAny =
    (providers.flatrate?.length ?? 0) > 0 ||
    (providers.rent?.length ?? 0) > 0 ||
    (providers.buy?.length ?? 0) > 0;

  if (!hasAny) {
    return (
      <p className="text-sm text-muted-foreground">
        No disponible en streaming, alquiler en Perú (según TMDB).
      </p>
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Disponible en Perú</h2>
      <ProviderList
        title="Suscripción"
        providers={providers.flatrate ?? []}
        mediaTitle={title}
        aggregateLink={providers.link}
      />
      <ProviderList
        title="Alquiler"
        providers={providers.rent ?? []}
        mediaTitle={title}
        aggregateLink={providers.link}
      />
      <ProviderList
        title="Compra"
        providers={providers.buy ?? []}
        mediaTitle={title}
        aggregateLink={providers.link}
      />
      {providers.link && (
        <a 
          href={providers.link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted-foreground underline"
        >
          Ver en TMDB / JustWatch
        </a>
      )}
    </section>
  );
}