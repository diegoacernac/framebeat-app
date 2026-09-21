"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { CheckIcon } from "@phosphor-icons/react/dist/ssr";

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

    setUsername("");
    setSuccess("Usuario invitado");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap gap-2">
      <Input
        placeholder="@username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="max-w-xs"
      />
      <Button type="submit" disabled={loading}>
        {loading ? (
          <>
            <Spinner /> Invitando...
          </>
        ) : (
          "Invitar"
        )}
      </Button>
      {error && (
        <p className="w-full text-sm text-destructive animate-in fade-in duration-200">{error}</p>
      )}
      {success && (
        <p
          role="status"
          className="flex w-full items-center gap-1.5 text-sm text-amber-500 animate-in fade-in slide-in-from-top-1 duration-300"
        >
          <CheckIcon size={14} weight="bold" /> {success}
        </p>
      )}
    </form>
  );
}