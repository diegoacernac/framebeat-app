"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "./StarRatings";

type Props = {
  tmdbId: number;
  title: string;
  posterUrl: string | null;
  metadata: Record<string, unknown>;
  initialStars?: number;
  initialReview?: string | null;
  ratingId?: string;
};

export function RatingForm({
  tmdbId,
  title,
  posterUrl,
  metadata,
  initialStars = 0,
  initialReview = "",
  ratingId,
}: Props) {
  const router = useRouter();
  const [stars, setStars] = useState(initialStars);
  const [review, setReview] = useState(initialReview ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setStars(initialStars);
    setReview(initialReview ?? "");
    setSuccess(null);
  }, [initialStars, initialReview, ratingId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (stars < 1) {
      setError("Selecciona al menos 1 estrella");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    const url = ratingId ? `/api/ratings/${ratingId}` : "/api/ratings";
    const method = ratingId ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        ratingId
          ? { stars, review }
          : { tmdbId, title, posterUrl, metadata, stars, review }
      ),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Error al guardar la valoración");
      return;
    }

    setSuccess(ratingId ? "Reseña actualizada" : "Reseña publicada");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <StarRating value={stars} onChange={setStars} />
      <Textarea
        placeholder="Escribe tu reseña (opcional)"
        value={review}
        onChange={(e) => setReview(e.target.value)}
        rows={4}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-muted-foreground">{success}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? "Guardando..." : ratingId ? "Actualizar" : "Publicar reseña"}
      </Button>
    </form>
  );
}
