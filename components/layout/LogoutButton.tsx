"use client";

import { useRouter } from "next/navigation";
import { SignOut } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleLogout} aria-label="Cerrar sesión">
      {/* En móvil solo el ícono, para dejar el header limpio */}
      <SignOut size={18} className="md:hidden" />
      <span className="hidden md:inline">Cerrar sesión</span>
    </Button>
  );
}
