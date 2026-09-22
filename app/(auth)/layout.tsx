import Link from "next/link";
import { PosterWall } from "@/components/marketing/PosterWall";
import { getPopularMovies, getPosterUrl } from "@/lib/tmdb";

// Login y registro: en web, a la izquierda un panel de pósters populares
// (mismo ambiente que la portada) y el formulario a la derecha. En móvil,
// solo el formulario con el logo arriba para poder volver al inicio.
export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const popular = await getPopularMovies().catch(() => []);
  const posters = popular
    .map((m) => getPosterUrl(m.poster_path, "w185"))
    .filter((url): url is string => Boolean(url));

  return (
    <div className="grid flex-1 lg:grid-cols-2">
      <aside className="relative isolate hidden overflow-hidden border-r lg:flex lg:flex-col lg:justify-end lg:p-12">
        <PosterWall posters={posters} className="-z-10" gridClassName="grid-cols-4" />
        <div className="max-w-md space-y-3">
          <Link href="/" className="block text-3xl font-semibold tracking-tight hover:text-amber-500">
            FrameBeat
          </Link>
          <p className="text-muted-foreground">
            Decidan qué ver juntos, guarden lo pendiente en listas compartidas y califiquen lo que vieron.
          </p>
        </div>
      </aside>

      <div className="flex flex-col items-center justify-center gap-8 p-6">
        <Link href="/" className="text-sm font-semibold tracking-tight lg:hidden">
          FrameBeat
        </Link>
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
