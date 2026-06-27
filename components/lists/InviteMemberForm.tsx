"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
        {loading ? "Invitando..." : "Invitar"}
      </Button>
      {error && <p className="w-full text-sm text-destructive">{error}</p>}
      {success && (
        <p className="w-full text-sm text-muted-foreground">{success}</p>
      )}
    </form>
  );
}