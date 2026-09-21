"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckIcon, ListPlusIcon, PlusIcon } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import type { MediaType } from "@/lib/media";

type ListOption = {
  id: string;
  title: string;
  listItemId: string | null; // null = este título no está en esa lista
};

type Props = {
  lists: ListOption[];
  mediaType: MediaType;
  externalId: string;
  title: string;
  posterUrl: string | null;
  metadata: Record<string, unknown>;
};

export function AddToListButton({
  lists: initialLists,
  mediaType,
  externalId,
  title,
  posterUrl,
  metadata,
}: Props) {
  const [open, setOpen] = useState(false);
  // Copia local: al añadir/quitar actualizamos aquí sin recargar la página
  const [lists, setLists] = useState(initialLists);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const inCount = lists.filter((l) => l.listItemId).length;

  async function toggle(list: ListOption) {
    setPendingId(list.id);
    setError(null);

    const res = list.listItemId
      ? await fetch(`/api/lists/${list.id}/items/${list.listItemId}`, { method: "DELETE" })
      : await fetch(`/api/lists/${list.id}/items`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mediaType, externalId, title, posterUrl, metadata }),
        });

    setPendingId(null);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No se pudo actualizar la lista");
      return;
    }

    // El POST devuelve el list_item creado (con su id), que guardamos para
    // poder quitarlo después sin recargar
    const newItemId: string | null = list.listItemId ? null : (await res.json()).id;
    setLists((prev) =>
      prev.map((l) => (l.id === list.id ? { ...l, listItemId: newItemId } : l))
    );
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant={inCount > 0 ? "secondary" : "outline"}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        {inCount > 0 ? (
          <>
            <CheckIcon weight="bold" className="text-amber-500" />
            En {inCount} {inCount === 1 ? "lista" : "listas"}
          </>
        ) : (
          <>
            <ListPlusIcon /> Añadir a lista
          </>
        )}
      </Button>

      {open && (
        <div className="max-w-sm border bg-background p-1 shadow-lg animate-in fade-in slide-in-from-top-1 duration-200">
          {lists.length === 0 ? (
            <p className="p-2 text-sm text-muted-foreground">
              Aún no tienes listas.{" "}
              <Link href="/lists/new" className="text-amber-500 hover:underline">
                Crea una
              </Link>
            </p>
          ) : (
            <ul>
              {lists.map((list) => {
                const isIn = list.listItemId !== null;
                const isPending = pendingId === list.id;
                return (
                  <li key={list.id}>
                    <button
                      type="button"
                      onClick={() => toggle(list)}
                      disabled={pendingId !== null}
                      className={cn(
                        "flex w-full items-center gap-2.5 px-2 py-2 text-left text-sm transition-colors hover:bg-muted disabled:opacity-60",
                        isIn && "text-amber-500"
                      )}
                    >
                      {/* Casilla: spinner mientras guarda, ✓ si está, + si no */}
                      <span
                        className={cn(
                          "flex size-5 shrink-0 items-center justify-center border transition-colors",
                          isIn ? "border-amber-500 bg-amber-500/15" : "border-border"
                        )}
                      >
                        {isPending ? (
                          <Spinner size={11} />
                        ) : isIn ? (
                          <CheckIcon
                            key="in"
                            size={12}
                            weight="bold"
                            className="animate-in zoom-in-50 duration-200"
                          />
                        ) : (
                          <PlusIcon size={11} className="text-muted-foreground" />
                        )}
                      </span>
                      <span className="truncate">{list.title}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {error && (
            <p className="px-2 pb-1 text-xs text-destructive animate-in fade-in duration-200">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
