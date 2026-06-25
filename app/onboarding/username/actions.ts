"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import { usernameSchema } from "@/lib/validations/username";

export async function saveUsername(formData: FormData) {
  const raw = formData.get("username");
  const parsed = usernameSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Username inválido" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const existing = await db.query.profiles.findFirst({
    where: eq(profiles.userId, user.id),
  });
  if (existing) {
    redirect("/");
  }

  const taken = await db.query.profiles.findFirst({
    where: eq(profiles.username, parsed.data),
  });
  if (taken) {
    return { error: "Ese username ya está en uso" };
  }

  await db.insert(profiles).values({
    userId: user.id,
    username: parsed.data,
    displayName: user.user_metadata?.full_name ?? null,
    avatarUrl: user.user_metadata?.avatar_url ?? null,
  });

  redirect("/");
}
