"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

// Invitación pendiente a una lista. Hasta aceptarla no ves la lista, y quien
// te invitó no ve tus calificaciones (ver lib/visibility.ts).
export function InvitationCard({
  listId,
  title,
  invitedBy,
  itemCount,
}: {
  listId: string;
  title: string;
  invitedBy: string | null;
  itemCount: number;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<"accept" | "decline" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function respond(accept: boolean) {
    setPending(accept ? "accept" : "decline");
    setError(null);
    const res = await fetch(`/api/lists/${listId}/invitation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accept }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "No se pudo responder");
      setPending(null);
      return;
    }
    startTransition(() => {
      if (accept) router.push(`/lists/${listId}`);
      router.refresh();
    });
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 border border-amber-500/40 bg-amber-500/5 p-4 animate-in fade-in duration-300">
      <div className="min-w-0 space-y-0.5">
        <p className="font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">
          {invitedBy ? `@${invitedBy} te invitó` : "Te invitaron"} · {itemCount}{" "}
          {itemCount === 1 ? "título" : "títulos"}
        </p>
        <p className="text-xs text-muted-foreground">
          Al aceptar, los miembros verán tus calificaciones de los títulos de esta lista.
        </p>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="ghost" disabled={pending !== null} onClick={() => respond(false)}>
          {pending === "decline" ? <Spinner size={12} /> : "Rechazar"}
        </Button>
        <Button size="sm" disabled={pending !== null} onClick={() => respond(true)}>
          {pending === "accept" ? (
            <>
              <Spinner size={12} /> Aceptando
            </>
          ) : (
            "Aceptar"
          )}
        </Button>
      </div>
    </li>
  );
}
