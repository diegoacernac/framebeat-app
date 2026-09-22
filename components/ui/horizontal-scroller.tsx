"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

// Fila con scroll horizontal y sin barra visible: en web se mueve con flechas
// (aparecen al pasar el mouse), en móvil deslizando. Los hijos son <li>.
// arrowClassName ubica las flechas en vertical (p. ej. a mitad del poster,
// no a mitad de poster + texto).
export function HorizontalScroller({
  children,
  className,
  arrowClassName = "top-1/2",
}: {
  children: ReactNode;
  className?: string;
  arrowClassName?: string;
}) {
  const scrollerRef = useRef<HTMLUListElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  function updateArrows() {
    const el = scrollerRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }

  // Al montar y cuando cambia el ancho (girar el móvil, redimensionar)
  useEffect(() => {
    updateArrows();
    const el = scrollerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(updateArrows);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  function scrollBy(direction: 1 | -1) {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" });
  }

  return (
    <div className="group/row relative">
      <ul
        ref={scrollerRef}
        onScroll={updateArrows}
        className={cn(
          // Margen negativo en móvil: la fila llega al borde de la pantalla
          "-mx-4 flex snap-x gap-3 overflow-x-auto scroll-smooth px-4 sm:mx-0 sm:px-0",
          "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          // Desvanecido en el borde por el que hay más: indica que se puede deslizar
          canRight && "sm:[mask-image:linear-gradient(to_right,black_85%,transparent)]",
          className
        )}
      >
        {children}
      </ul>

      {canLeft && <ArrowButton direction="left" className={arrowClassName} onClick={() => scrollBy(-1)} />}
      {canRight && <ArrowButton direction="right" className={arrowClassName} onClick={() => scrollBy(1)} />}
    </div>
  );
}

function ArrowButton({
  direction,
  className,
  onClick,
}: {
  direction: "left" | "right";
  className: string;
  onClick: () => void;
}) {
  const Icon = direction === "left" ? CaretLeftIcon : CaretRightIcon;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === "left" ? "Ver anteriores" : "Ver más"}
      className={cn(
        // Solo con mouse (md+)
        "absolute z-10 hidden size-9 -translate-y-1/2 items-center justify-center border border-foreground/20 bg-background/90 text-foreground shadow-lg backdrop-blur transition-opacity md:flex",
        "opacity-0 group-hover/row:opacity-100 focus-visible:opacity-100 hover:border-foreground/60",
        direction === "left" ? "-left-4" : "-right-4",
        className
      )}
    >
      <Icon size={16} weight="bold" />
    </button>
  );
}
