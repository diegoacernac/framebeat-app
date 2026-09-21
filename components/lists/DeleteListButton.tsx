"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
      <Button
        type="button"
        variant="destructive"
        size="sm"
        onClick={handleDelete}
        disabled={deleting}
      >
        {deleting ? (
          <>
            <Spinner /> Borrando...
          </>
        ) : (
          "Borrar lista"
        )}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
