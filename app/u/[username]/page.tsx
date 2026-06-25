import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.username, username.toLowerCase()),
  });

  if (!profile) notFound();

  const initials = profile.username.slice(0, 2).toUpperCase();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-8">
      <div className="flex items-center gap-4">
        <Avatar className="size-16">
          {profile.avatarUrl && (
            <AvatarImage src={profile.avatarUrl} alt={profile.username} />
          )}
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-semibold">
            {profile.displayName ?? profile.username}
          </h1>
          <p className="text-muted-foreground">@{profile.username}</p>
        </div>
      </div>
      {profile.bio && <p className="text-sm">{profile.bio}</p>}
      <p className="text-sm text-muted-foreground">
        Aún no hay calificaciones. Sprint 1 añadirá películas aquí.
      </p>
    </main>
  );
}
