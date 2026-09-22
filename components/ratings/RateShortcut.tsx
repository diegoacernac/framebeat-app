import { StarIcon } from "@phosphor-icons/react/dist/ssr";

// Atajo en la cabecera de la ficha: baja hasta el formulario de calificación.
// Si ya calificaste muestra tu nota, así se ve sin hacer scroll.
export function RateShortcut({
  href,
  stars,
  label = "Calificar",
}: {
  href: string;
  stars: number | null;
  label?: string;
}) {
  return (
    <a
      href={href}
      className="inline-flex h-8 items-center gap-1.5 border border-foreground/20 bg-background/40 px-2.5 text-xs font-medium backdrop-blur transition-colors hover:border-amber-500 hover:text-amber-500"
    >
      <StarIcon size={14} weight={stars ? "fill" : "regular"} className="text-amber-500" />
      {stars ? (
        <>
          {stars}/5 <span className="font-normal text-muted-foreground">· Tu nota</span>
        </>
      ) : (
        label
      )}
    </a>
  );
}
