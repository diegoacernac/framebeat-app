"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { CheckIcon, UserPlusIcon } from "@phosphor-icons/react/dist/ssr";

export function InviteMemberForm({ listId }: { listId: string }) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const res = await fetch(`/api/lists/${listId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: username.replace(/^@/, "").toLowerCase(),
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "No se pudo invitar");
      return;
    }

    const invited = username.replace(/^@/, "").toLowerCase();
    setUsername("");
    // Queda pendiente hasta que acepte desde "Mis listas"
    setSuccess(`Invitación enviada a @${invited}. Verá la lista cuando la acepte.`);
    router.refresh();
  }

  return (
    // Una sola línea: campo + botón pegados (el botón ya no compite con el ámbar
    // de la cabecera)
    <form onSubmit={handleSubmit} className="flex flex-wrap">
      <Input
        placeholder="@usuario"
        aria-label="Usuario a invitar"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="h-9 min-w-0 flex-1 border-r-0"
      />
      <Button type="submit" variant="outline" disabled={loading || !username.trim()} className="h-9 px-3">
        {loading ? <Spinner /> : <UserPlusIcon size={15} />}
        {loading ? "Invitando" : "Invitar"}
      </Button>
      {error && (
        <p className="mt-2 w-full text-sm text-destructive animate-in fade-in duration-200">{error}</p>
      )}
      {success && (
        <p
          role="status"
          className="mt-2 flex w-full items-center gap-1.5 text-sm text-primary animate-in fade-in slide-in-from-top-1 duration-300"
        >
          <CheckIcon size={14} weight="bold" /> {success}
        </p>
      )}
    </form>
  );
}