import { Header } from "@/components/layout/Header";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: { username: string } | null = null;
  if (user) {
    profile =
      (await db.query.profiles.findFirst({
        where: eq(profiles.userId, user.id),
      })) ?? null;
  }

  return (
    <>
      <Header user={user} profile={profile} />
      {children}
    </>
  );
}
