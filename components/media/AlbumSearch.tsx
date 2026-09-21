"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useDebouncedFetch } from "@/hooks/useDebouncedFetch";
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
  const trimmed = query.trim();
  const { data, loading, error } = useDebouncedFetch<{ results?: AlbumResult[] }>(
    trimmed ? `/api/albums/search?q=${encodeURIComponent(trimmed)}` : null
  );
  const results = data?.results ?? [];

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

      {!loading && error && (
        <p className="text-sm text-destructive">
          No se pudo buscar. Intenta de nuevo.
        </p>
      )}

      {!loading && !error && trimmed && results.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No se encontraron álbumes.
        </p>
      )}
    </div>
  );
}
