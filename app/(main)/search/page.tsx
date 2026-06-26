import { MediaSearch } from "@/components/media/MediaSearch";

export default function SearchPage() {
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 p-8">
      <h1 className="mb-6 text-2xl font-semibold">Buscar películas</h1>
      <MediaSearch />
    </main>
  );
}