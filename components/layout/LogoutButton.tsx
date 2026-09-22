"use client";

import { useFormStatus } from "react-dom";
import { SignOut } from "@phosphor-icons/react";
import { signOut } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export function LogoutButton() {
  return (
    // Server Action: sin el cliente de Supabase en el navegador
    <form action={signOut}>
      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="ghost" size="sm" disabled={pending} aria-label="Cerrar sesión">
      {/* En móvil solo el ícono, para dejar el header limpio */}
      {pending ? <Spinner size={16} className="md:hidden" /> : <SignOut size={18} className="md:hidden" />}
      <span className="hidden md:inline">{pending ? "Saliendo..." : "Cerrar sesión"}</span>
    </Button>
  );
}
