"use client";

import { useRef, useState } from "react";
import { PlayIcon, XIcon } from "@phosphor-icons/react/dist/ssr";
import type { Trailer } from "@/lib/tmdb";

// "▶ Ver tráiler" y un reproductor en ventana sobre la página.
// - <dialog> nativo: Escape cierra, el foco queda dentro y va por encima de
//   todo (incluida la barra inferior) sin pelear con z-index.
// - YouTube solo se carga al abrir (la ficha no se vuelve más lenta) y se
//   desmonta al cerrar, así el video deja de sonar.
// - youtube-nocookie: no deja cookies hasta que se reproduce.
// - Si el tráiler está en inglés, se piden subtítulos en español.
// - Selector de versión (Latino / Subtitulado / Inglés / España): solo las
//   que existen. Abre en la preferida (la primera) y se cambia sin cerrar.
export function TrailerButton({ trailer, title }: { trailer: Trailer; title: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [versionIndex, setVersionIndex] = useState(0);
  const version = trailer.versions[versionIndex] ?? trailer.versions[0];

  function show() {
    setVersionIndex(0);
    setOpen(true);
    dialogRef.current?.showModal();
  }

  function close() {
    dialogRef.current?.close();
  }

  return (
    <>
      <button
        type="button"
        onClick={show}
        className="inline-flex h-8 items-center gap-1.5 bg-amber-500 px-3 text-xs font-medium text-black transition-colors hover:bg-amber-400"
      >
        <PlayIcon size={14} weight="fill" /> Ver tráiler
      </button>

      <dialog
        ref={dialogRef}
        onClose={() => setOpen(false)}
        // Escape propio además del nativo: Chrome a veces no cierra el
        // <dialog> con Escape (protección contra ventanas que no se cierran)
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            close();
          }
        }}
        // Clic en el fondo oscuro (fuera del video) cierra
        onClick={(e) => e.target === e.currentTarget && close()}
        aria-label={`Tráiler de ${title}`}
        className="m-auto w-[min(100%-2rem,64rem)] max-w-none bg-transparent p-0 text-foreground backdrop:bg-black/85 backdrop:backdrop-blur-sm open:animate-in open:fade-in open:zoom-in-95"
      >
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
              {trailer.versions.length > 1 && (
                <div role="group" aria-label="Versión del tráiler" className="inline-flex border border-white/20">
                  {trailer.versions.map((v, i) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setVersionIndex(i)}
                      aria-pressed={i === versionIndex}
                      className={
                        i === versionIndex
                          ? "bg-amber-500 px-2.5 py-1 text-xs font-medium text-black"
                          : "px-2.5 py-1 text-xs text-white/70 transition-colors hover:text-white"
                      }
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              )}
              <p className="min-w-0 truncate text-sm text-white/60">{version.name}</p>
            </div>
            <button
              type="button"
              onClick={close}
              aria-label="Cerrar tráiler"
              autoFocus
              className="flex size-8 shrink-0 items-center justify-center text-white/80 transition-colors hover:text-white"
            >
              <XIcon size={20} />
            </button>
          </div>
          <div className="relative aspect-video overflow-hidden bg-black shadow-2xl">
            {open && (
              <iframe
                // key: al cambiar de versión se carga el otro video desde cero
                key={version.youtubeKey}
                src={`https://www.youtube-nocookie.com/embed/${version.youtubeKey}?${new URLSearchParams({
                  autoplay: "1",
                  rel: "0",
                  modestbranding: "1",
                  hl: "es",
                  // En inglés: subtítulos en español activados (si el video los tiene)
                  ...(version.wantsSubtitles ? { cc_load_policy: "1", cc_lang_pref: "es" } : {}),
                })}`}
                title={`Tráiler de ${title}`}
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
                className="absolute inset-0 size-full"
              />
            )}
          </div>
        </div>
      </dialog>
    </>
  );
}
