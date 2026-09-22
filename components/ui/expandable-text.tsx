"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// Texto largo cortado a unas líneas en móvil con "Leer más"; en web (md+)
// siempre completo. El botón solo aparece si el texto de verdad se corta.
export function ExpandableText({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [clamped, setClamped] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => setClamped(el.scrollHeight > el.clientHeight + 1);
    check();
    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="space-y-1">
      <p ref={ref} className={cn(className, !expanded && "line-clamp-4 md:line-clamp-none")}>
        {text}
      </p>
      {(clamped || expanded) && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          aria-expanded={expanded}
          className="text-xs font-medium text-foreground underline-offset-4 hover:text-amber-500 hover:underline md:hidden"
        >
          {expanded ? "Leer menos" : "Leer más"}
        </button>
      )}
    </div>
  );
}
