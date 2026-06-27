import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { listMembers, sharedLists } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

export default async function ListsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const lists = await db
    .select({
      id: sharedLists.id,
      title: sharedLists.title,
      description: sharedLists.description,
      role: listMembers.role,
      createdAt: sharedLists.createdAt,
    })
    .from(listMembers)
    .innerJoin(sharedLists, eq(listMembers.listId, sharedLists.id))
    .where(eq(listMembers.userId, user.id));

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 space-y-6 p-8 animate-in fade-in duration-300">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Mis listas</h1>
        <Button asChild>
          <Link href="/lists/new">Nueva lista</Link>
        </Button>
      </div>
      {lists.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aún no tienes listas compartidas.
        </p>
      ) : (
        <ul className="space-y-3">
          {lists.map((list) => (
            <li key={list.id} className="border p-4">
              <Link href={`/lists/${list.id}`} className="font-medium hover:underline">
                {list.title}
              </Link>
              {list.description && (
                <p className="mt-1 text-sm text-muted-foreground">{list.description}</p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                {list.role === "owner" ? "Propietario" : "Miembro"}
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}