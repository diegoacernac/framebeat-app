"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { MediaCard } from "./MediaCard";
import { MediaCardSkeleton } from "./MediaCardSkeleton";
import { getAlbumCoverUrl } from "@/lib/spotify";

type AlbumResult = {
  id: string;
  name: string;
  release_date: string;
  images: { url: string; width: number; height: number }[];
  artists: { name: string }[];
};

export function AlbumSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AlbumResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const timer = setTimeout(async () => {
      const res = await fetch(
        `/api/albums/search?q=${encodeURIComponent(query)}`
      );
      const data = await res.json();
      setResults(data.results ?? []);
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="space-y-6">
      <Input
        placeholder="Buscar álbumes..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {loading ? (
          <MediaCardSkeleton aspectRatio="square" />
        ) : (
          results.map((album, i) => (
            <MediaCard
              key={album.id}
              index={i}
              aspectRatio="square"
              href={`/albums/${album.id}`}
              title={album.name}
              subtitle={album.artists.map((a) => a.name).join(", ")} 
              posterUrl={getAlbumCoverUrl(album.images, "large")}
            />
          ))
        )}
      </div>

      {!loading && query.trim() && results.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No se encontraron álbumes.
        </p>
      )}
    </div>
  );
}
