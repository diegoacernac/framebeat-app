import Link from "next/link";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.userId, user.id),
    });
    if (!profile) redirect("/onboarding/username");

    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
        <div className="space-y-2">
          <h1 className="text-4xl font-semibold">FrameBeat</h1>
          <p className="text-muted-foreground">
            Hola, @{profile.username}
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/u/${profile.username}`}>Ver mi perfil</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 p-8 text-center">
      <div className="space-y-2">
        <h1 className="text-4xl font-semibold">FrameBeat</h1>
        <p className="text-muted-foreground">
          Califica lo que ves y escuchas
        </p>
      </div>
      <div className="flex gap-3">
        <Button asChild>
          <Link href="/register">Registrarse</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/login">Iniciar sesión</Link>
        </Button>
      </div>
    </main>
  );
}
