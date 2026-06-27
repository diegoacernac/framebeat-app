import { AlbumSearch } from "@/components/media/AlbumSearch";
import { MediaSearch } from "@/components/media/MediaSearch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getPopularMovies } from "@/lib/tmdb";

export default async function SearchPage() {
  const popular = await getPopularMovies().catch(() => []);

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 p-4 sm:p-8">
      <h1 className="mb-6 text-2xl font-semibold">Buscar</h1>
      <Tabs defaultValue="movies">
        <TabsList>
          <TabsTrigger value="movies">Películas</TabsTrigger>
          <TabsTrigger value="albums">Álbumes</TabsTrigger>
        </TabsList>
        <TabsContent value="movies" className="mt-6">
          <MediaSearch initialResults={popular} />
        </TabsContent>
        <TabsContent value="albums" className="mt-6">
          <AlbumSearch />
        </TabsContent>
      </Tabs>
    </main>
  );
}
