import { cn } from "@/lib/utils";

// Selector segmentado (Películas | Series, pestañas de Inicio, versión del
// tráiler...): grupo con borde y la opción activa en ámbar sólido. Es el
// estilo de "¿Qué vemos?", compartido para que toda la app se vea igual.
export const segmentedGroupClass = "inline-flex w-fit border";

export function segmentedItemClass(active: boolean, size: "sm" | "md" = "md") {
  return cn(
    "flex items-center gap-1.5 whitespace-nowrap transition-colors",
    size === "md" ? "px-3 py-1.5 text-sm" : "px-2.5 py-1 text-xs",
    active ? "bg-primary font-medium text-primary-foreground" : "text-foreground/75 hover:text-foreground"
  );
}
