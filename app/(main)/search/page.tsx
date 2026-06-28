import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MediaSearch } from "@/components/media/MediaSearch";
import { PersonMovieSearch } from "@/components/media/PersonMovieSearch";
import { getPopularMovies } from "@/lib/tmdb";

export default async function SearchPage() {
  const popular = await getPopularMovies().catch(() => []);

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 p-4 sm:p-8">
      <h1 className="mb-6 text-2xl font-semibold">Buscar</h1>
      <Tabs defaultValue="title">
        <TabsList>
          <TabsTrigger value="title">Por título</TabsTrigger>
          <TabsTrigger value="person">Por actor o director</TabsTrigger>
        </TabsList>
        <TabsContent value="title" className="mt-6">
          <MediaSearch initialResults={popular} />
        </TabsContent>
        <TabsContent value="person" className="mt-6">
          <PersonMovieSearch />
        </TabsContent>
      </Tabs>
    </main>
  );
}
