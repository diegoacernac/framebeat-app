"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShuffleIcon } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SectionLabel } from "@/components/ui/section-label";

type Candidate = {
  listItemId: string;
  title: string;
  posterUrl: string | null;
  href: string;
};

const SPIN_MS = 900; // duración total del "giro"
const TICK_MS = 70; // cada cuánto cambia el título mientras gira

// Barra de acciones de la lista (estilo Spotify): el botón principal redondo
// es "Elegir al azar"; las demás acciones (children) van a su lado. El
// resultado ("Hoy toca…") aparece debajo de la barra.
export function RandomPickButton({
  candidates,
  children,
}: {
  candidates: Candidate[];
  children?: React.ReactNode;
}) {
  const canPick = candidates.length >= 2;
  const [shown, setShown] = useState<Candidate | null>(null);
  const [spinning, setSpinning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Si el componente se desmonta a mitad del giro, paramos el intervalo
  useEffect(() => () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  function randomOther(current: Candidate | null) {
    // Evita repetir el mismo dos veces seguidas (si hay más de uno)
    const pool =
      current && candidates.length > 1
        ? candidates.filter((c) => c.listItemId !== current.listItemId)
        : candidates;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function spin() {
    if (spinning || candidates.length === 0) return;
    setSpinning(true);

    let current = shown;
    const startedAt = Date.now();
    intervalRef.current = setInterval(() => {
      current = randomOther(current);
      setShown(current);

      if (Date.now() - startedAt >= SPIN_MS) {
        clearInterval(intervalRef.current!);
        intervalRef.current = null;
        setSpinning(false);
      }
    }, TICK_MS);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        {canPick && (
          <button
            type="button"
            onClick={spin}
            disabled={spinning}
            className="group flex items-center gap-3 text-sm font-medium"
          >
            <span className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/20 transition-transform duration-200 group-hover:scale-105 group-active:scale-95">
              <ShuffleIcon size={22} weight="bold" className={cn(spinning && "animate-pulse")} />
            </span>
            <span className="pr-2">{shown ? "Elegir otra" : "Elegir al azar"}</span>
          </button>
        )}
        {children}
      </div>

      {shown && (
        <div
          // key fija mientras gira; al terminar cambia → la tarjeta hace un "pop"
          key={spinning ? "spinning" : shown.listItemId}
          className={cn(
            "flex items-center gap-4 border bg-card p-3 transition-colors",
            spinning
              ? "border-border"
              : "border-primary/60 bg-primary/5 animate-in zoom-in-95 fade-in duration-300"
          )}
          aria-live="polite"
        >
          <div className="relative aspect-[2/3] w-12 shrink-0 overflow-hidden bg-muted">
            {shown.posterUrl && (
              <Image src={shown.posterUrl} alt="" fill className="object-cover" sizes="48px" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <SectionLabel as="p">
              {spinning ? "Eligiendo..." : "Hoy toca"}
            </SectionLabel>
            <p className={cn("truncate font-medium", spinning && "text-muted-foreground")}>
              {shown.title}
            </p>
          </div>
          {!spinning && (
            <Button size="sm" asChild className="animate-in fade-in duration-300">
              <Link href={shown.href}>Ver ficha</Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
