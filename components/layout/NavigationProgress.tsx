"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// Barra fina arriba que arranca en el mismo instante del clic en un enlace
// interno y termina cuando la URL cambia. Así la app nunca parece congelada
// mientras el servidor responde (el esqueleto de loading.tsx aparece después).
export function NavigationProgress() {
  return (
    // useSearchParams necesita Suspense para no volver dinámica toda la página
    <Suspense fallback={null}>
      <ProgressBar />
    </Suspense>
  );
}

type State = "idle" | "loading" | "done";

function ProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [state, setState] = useState<State>("idle");
  const [progress, setProgress] = useState(0);
  const trickle = useRef<ReturnType<typeof setInterval> | null>(null);
  const url = `${pathname}?${searchParams.toString()}`;

  function stopTrickle() {
    if (trickle.current) clearInterval(trickle.current);
    trickle.current = null;
  }

  // Arranca con cualquier clic en un <a> interno que lleve a otra URL
  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element).closest?.("a");
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      const next = new URL(anchor.href, location.href);
      if (next.origin !== location.origin) return;
      // Misma página (o solo un #ancla): no hay navegación que esperar
      if (next.pathname === location.pathname && next.search === location.search) return;

      stopTrickle();
      setState("loading");
      setProgress(15);
      // Avanza cada vez más lento, sin llegar nunca al final por su cuenta
      trickle.current = setInterval(() => {
        setProgress((p) => p + (90 - p) * 0.1);
      }, 200);
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  // La URL cambió: la navegación llegó. Completa la barra y la desvanece.
  // (setState aquí es intencional: sincroniza la barra con la navegación)
  useEffect(() => {
    stopTrickle();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState((s) => (s === "loading" ? "done" : s));
    setProgress((p) => (p > 0 ? 100 : 0));
  }, [url]);

  useEffect(() => {
    if (state !== "done") return;
    const timer = setTimeout(() => {
      setState("idle");
      setProgress(0);
    }, 450);
    return () => clearTimeout(timer);
  }, [state]);

  // Por si una navegación se cancela (p. ej. un redirect a la misma URL)
  useEffect(() => {
    if (state !== "loading") return;
    const timer = setTimeout(() => setState("done"), 15000);
    return () => clearTimeout(timer);
  }, [state]);

  useEffect(() => stopTrickle, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5"
      // Al terminar: llega al 100% y recién ahí se desvanece (delay de 150ms)
      style={{
        opacity: state === "loading" ? 1 : 0,
        transition: state === "done" ? "opacity 250ms ease 150ms" : "none",
      }}
    >
      <div
        className="h-full bg-amber-500 shadow-[0_0_8px_var(--color-amber-500)]"
        style={{
          width: `${progress}%`,
          transition: state === "loading" ? "width 200ms ease-out" : "width 150ms ease-out",
        }}
      />
    </div>
  );
}
