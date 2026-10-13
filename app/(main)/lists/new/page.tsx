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
    // El título de la página es el propio campo de nombre (estilo documento)
    <main className="mx-auto w-full max-w-4xl flex-1 p-4 pt-8 sm:p-8 sm:pt-12 lg:max-w-6xl animate-in fade-in duration-300">
      <h1 className="sr-only">Nueva lista</h1>
      <CreateListForm />
    </main>
  );
}