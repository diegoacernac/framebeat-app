"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveUsername } from "./actions";

type FormState = { error?: string } | null;

async function usernameAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  return (await saveUsername(formData)) ?? null;
}

export function UsernameForm() {
  const [state, formAction, pending] = useActionState(usernameAction, null);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          name="username"
          placeholder="diego_films"
          pattern="[a-z0-9_]+"
          minLength={3}
          maxLength={30}
          required
        />
      </div>
      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Guardando..." : "Continuar"}
      </Button>
    </form>
  );
}
