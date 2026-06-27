import { redirect } from "next/navigation";
import { createClient } from "../../../../lib/supabase/server";
import { CreateListForm } from "../../../../components/lists/CreateListForm";

export default async function NewListPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <main className="mx-auto w-full max-w-lg flex-1 p-8 animate-in fade-in duration-300">
      <h1 className="mb-6 text-2xl font-semibold">Nueva lista</h1>
      <CreateListForm />
    </main>
  );
}