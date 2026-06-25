import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import { UsernameForm } from "./username-form";

export default async function UsernameOnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, user.id),
  });
  if (profile) redirect("/");

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-4">
        <div>
          <h1 className="text-2xl font-semibold">Elige tu username</h1>
          <p className="text-sm text-muted-foreground">
            Será tu URL pública: /u/tuusername
          </p>
        </div>
        <UsernameForm />
      </div>
    </div>
  );
}
