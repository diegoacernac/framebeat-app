"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TrashIcon } from "@phosphor-icons/react/dist/ssr";
import { Spinner } from "@/components/ui/spinner";

type Props = {
  listId: string;
  title: string;
};

export function DeleteListButton({ listId, title }: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    const ok = confirm(
      `¿Borrar la lista "${title}"?\n\nSe borra para todos los miembros y no se puede deshacer. Sus calificaciones se mantienen.`
    );
    if (!ok) return;

    setDeleting(true);
    setError(null);

    const res = await fetch(`/api/lists/${listId}`, { method: "DELETE" });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No se pudo borrar la lista");
      setDeleting(false);
      return;
    }

    // replace (no push): así "atrás" no vuelve a una lista que ya no existe
    router.replace("/lists");
  }

  return (
    <div className="space-y-2">
      {/* Discreto: es una acción rara y destructiva, no merece una "zona"
          con título propio. Pide confirmación igual. */}
      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
      >
        {deleting ? <Spinner size={12} /> : <TrashIcon size={13} />}
        {deleting ? "Borrando..." : "Borrar lista"}
      </button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
