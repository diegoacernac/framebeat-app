"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SparkleIcon } from "@phosphor-icons/react/dist/ssr";
import { useDebouncedFetch } from "@/hooks/useDebouncedFetch";
import { getPosterUrl } from "@/lib/tmdb";
import { Button } from "../ui/button";
import { Spinner } from "../ui/spinner";
import { SectionLabel } from "../ui/section-label";
import { Skeleton } from "../ui/skeleton";
import { chipClass } from "../ui/chip";

type PreviewGroup = {
  key: string;
  title: string;
  total: number;
  items: { id: number; title: string; posterPath: string | null }[];
};

// Plantillas: un toque y el título queda listo (o casi: "Maratón " espera el
// nombre del director, con el cursor al final)
const TEMPLATES = [
  { label: "Maratón de director", title: "Maratón " },
  { label: "Una saga", title: "Saga " },
  { label: "Noche de terror", title: "Noche de terror" },
  { label: "Clásicos de los 80", title: "Clásicos de los 80" },
  { label: "Comedias románticas", title: "Comedias románticas" },
  { label: "Pendientes en pareja", title: "Pendientes en pareja" },
];

// Crear lista como un documento (estilo Notion): título grande sin bordes,
// descripción que crece, plantillas para arrancar y, al lado, una vista
// previa en vivo de lo que la app va a sugerir con ese título.
export function CreateListForm() {
  const router = useRouter();
  const titleRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const query = new URLSearchParams({ title: title.trim(), description: description.trim() });
  const { data, loading: previewLoading } = useDebouncedFetch<{ groups?: PreviewGroup[] }>(
    title.trim() || description.trim() ? `/api/lists/preview?${query}` : null,
    500
  );
  const groups = data?.groups ?? [];

  function applyTemplate(text: string) {
    setTitle(text);
    // Foco al final del título, para seguir escribiendo ("Maratón |")
    requestAnimationFrame(() => {
      const input = titleRef.current;
      input?.focus();
      input?.setSelectionRange(text.length, text.length);
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Ponle un nombre a la lista");
      titleRef.current?.focus();
      return;
    }
    setLoading(true);
    setError(null);

    const res = await fetch("/api/lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim(), description: description.trim() || null }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "No se pudo crear la lista");
      setLoading(false);
      return;
    }

    const list = await res.json();
    router.push(`/lists/${list.id}`);
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      // Cmd/Ctrl + Enter crea la lista desde cualquier campo
      onKeyDown={(e) => {
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit(e);
      }}
      className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-14"
    >
      {/* Editor */}
      <div className="space-y-6">
        <div className="space-y-3">
          <SectionLabel as="p">Nueva lista</SectionLabel>
          <input
            ref={titleRef}
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setError(null);
            }}
            onKeyDown={(e) => {
              // Enter en el título pasa a la descripción (no envía)
              if (e.key === "Enter" && !e.metaKey && !e.ctrlKey) {
                e.preventDefault();
                (e.currentTarget.form?.elements.namedItem("description") as HTMLElement | null)?.focus();
              }
            }}
            placeholder="Nombre de la lista"
            aria-label="Nombre de la lista"
            maxLength={200}
            autoFocus
            className="w-full bg-transparent font-mono text-3xl font-semibold tracking-tight outline-none placeholder:text-foreground/20 sm:text-5xl"
          />
          <textarea
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Agrega una descripción: de qué va, con quién la armas, para cuándo…"
            aria-label="Descripción (opcional)"
            maxLength={1000}
            rows={2}
            // Crece con el texto (sin barra de scroll)
            className="field-sizing-content min-h-14 w-full resize-none bg-transparent font-sans text-base text-muted-foreground outline-none placeholder:text-foreground/25"
          />
        </div>

        <div className="space-y-3 border-t pt-6">
          <SectionLabel as="p">Ideas para empezar</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {TEMPLATES.map((t) => (
              <button key={t.label} type="button" onClick={() => applyTemplate(t.title)} className={chipClass(false, "sm")}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t pt-6">
          <Button type="submit" size="lg" disabled={loading}>
            {loading ? (
              <>
                <Spinner /> Creando...
              </>
            ) : (
              "Crear lista"
            )}
          </Button>
          <Button type="button" variant="ghost" size="lg" asChild>
            <Link href="/lists">Cancelar</Link>
          </Button>
          <span className="hidden text-xs text-muted-foreground sm:inline">⌘ + Enter para crear</span>
          {error && <p className="w-full text-sm text-destructive animate-in fade-in duration-200">{error}</p>}
        </div>
      </div>

      {/* Vista previa en vivo */}
      <aside className="space-y-4 border bg-card p-5 lg:sticky lg:top-6" aria-live="polite">
        <div className="flex items-center gap-2">
          <SparkleIcon size={14} className="text-primary" />
          <SectionLabel as="p">Te sugeriremos</SectionLabel>
        </div>

        {!title.trim() && !description.trim() ? (
          <p className="font-sans text-sm text-muted-foreground">
            Escribe un director, una saga, un género o una década, y aquí verás lo que la app te va a proponer para tu lista.
          </p>
        ) : previewLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-2/3" />
            <div className="flex gap-1.5">
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} className="aspect-[2/3] w-10" />
              ))}
            </div>
          </div>
        ) : groups.length === 0 ? (
          <p className="font-sans text-sm text-muted-foreground">
            Todavía no reconocemos nada en el nombre. Prueba con un director («Maratón Nolan»), una saga («Harry Potter») o un género («Noche de terror»). Igual puedes crearla y añadir títulos a mano.
          </p>
        ) : (
          <ul className="space-y-5">
            {groups.map((g) => (
              <li key={g.key} className="space-y-2 animate-in fade-in duration-300">
                <p className="text-sm font-medium">
                  {g.title} <span className="font-normal text-muted-foreground">· {g.total}</span>
                </p>
                <div className="flex gap-1.5">
                  {g.items.slice(0, 6).map((item) => {
                    const poster = getPosterUrl(item.posterPath, "w92");
                    return (
                      <div key={item.id} title={item.title} className="relative aspect-[2/3] w-10 overflow-hidden bg-muted">
                        {poster && <Image src={poster} alt={item.title} fill sizes="40px" className="object-cover" />}
                      </div>
                    );
                  })}
                </div>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </form>
  );
}
