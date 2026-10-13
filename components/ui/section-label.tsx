import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// Etiqueta de sección ("REPARTO", "SUGERENCIAS", "TUS FAVORITAS"...): mono,
// mayúsculas, chica y espaciada. Un solo estilo en toda la app; antes había
// cuatro variantes copiadas a mano.
export const sectionLabelClass =
  "text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground";

export function SectionLabel({
  as: Tag = "h2",
  className,
  children,
}: {
  as?: "h2" | "h3" | "p" | "span";
  className?: string;
  children: ReactNode;
}) {
  return <Tag className={cn(sectionLabelClass, className)}>{children}</Tag>;
}
