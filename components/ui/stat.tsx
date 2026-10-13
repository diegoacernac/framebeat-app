import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { sectionLabelClass } from "./section-label";

// Un número con su etiqueta (estadísticas, perfil, comparar). "tile" es una
// tarjeta con fondo; "inline" va suelto dentro de una fila.
export function Stat({
  value,
  suffix,
  label,
  accent = false,
  variant = "tile",
}: {
  value: ReactNode;
  // Parte chica y apagada al lado del número ("/5")
  suffix?: string;
  label: string;
  accent?: boolean;
  variant?: "tile" | "inline";
}) {
  return (
    <div className={cn(variant === "tile" && "border bg-card p-5")}>
      <p
        className={cn(
          "font-semibold tabular-nums tracking-tight",
          variant === "tile" ? "text-3xl" : "text-2xl",
          accent && "text-primary"
        )}
      >
        {value}
        {suffix && <span className="text-base font-normal text-muted-foreground">{suffix}</span>}
      </p>
      <p className={cn(sectionLabelClass, "mt-1")}>{label}</p>
    </div>
  );
}
