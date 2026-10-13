import { cn } from "@/lib/utils";

// Chip seleccionable (filtros de ¿Qué vemos?, temporadas, "Ocultar vistas").
// Un solo estilo: activo = relleno ámbar sólido (se distingue de un vistazo
// aunque haya muchos); inactivo = borde suave que se aclara al pasar.
export function chipClass(active: boolean, size: "sm" | "md" = "md") {
  return cn(
    "shrink-0 border transition-colors disabled:cursor-not-allowed disabled:opacity-35",
    size === "md" ? "px-3 py-1 text-sm" : "px-2.5 py-1 text-xs",
    active
      ? "border-primary bg-primary font-medium text-primary-foreground"
      : "border-foreground/20 text-foreground/80 hover:border-foreground/60 hover:text-foreground disabled:hover:border-foreground/20 disabled:hover:text-foreground/80"
  );
}
