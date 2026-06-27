import Image from "next/image";
import {
  getProviderLogoUrl,
  type WatchProvider,
  type WatchProvidersByCountry,
} from "@/lib/tmdb";

function ProviderList({
  title, providers,
}: {
  title: string;
  providers: WatchProvider[];
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
          return (
            <div
              key={p.provider_id}
              className="flex flex-items-center gap-2 border px-2 py-1 text-xs"
              title={p.provider_name}
            >
              {logo && (
                <Image
                  src={logo}
                  alt={p.provider_name}
                  width={20}
                  height={20}
                  className="rounded-sm"
                />
              )}
              <span>{p.provider_name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function WatchProviders({
  providers,
}: {
  providers: WatchProvidersByCountry | null;
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
      <ProviderList title="Suscripción" providers={providers.flatrate ?? []} />
      <ProviderList title="Alquiler" providers={providers.rent ?? []} />
      <ProviderList title="Compra" providers={providers.buy ?? []} />
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