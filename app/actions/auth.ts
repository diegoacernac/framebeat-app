"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Cerrar sesión en el servidor: así el header no necesita el cliente de
// Supabase en el navegador (~60 KB que se cargaban en todas las páginas)
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
