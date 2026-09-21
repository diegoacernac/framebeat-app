"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "./StarRatings";
import { CheckIcon } from "@phosphor-icons/react/dist/ssr";
import { Spinner } from "@/components/ui/spinner";

type Props = {
  mediaType: "movie" | "album" | "tv";
  externalId: string;
  title: string;
  posterUrl: string | null;
  metadata: Record<string, unknown>;
  initialStars?: number;
  initialReview?: string | null;
  ratingId?: string;
};

export function RatingForm({
  mediaType,
  externalId,
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
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // No hace falta sincronizar initialStars/initialReview con un useEffect:
  // tras guardar/eliminar, el estado local ya coincide con lo que trae el
  // servidor. Y la página de series le pasa `key` por temporada, así que al
  // cambiar de temporada React monta un formulario nuevo desde cero.
  // (No usamos el id de la reseña como key: al publicar cambiaría y el
  // formulario se re-montaría, perdiendo el mensaje "Reseña publicada".)

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
          : { mediaType, externalId, title, posterUrl, metadata, stars, review }
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

  async function handleDelete() {
    if (!ratingId || !confirm("¿Eliminar tu reseña?")) return;
    setDeleting(true);
    const res = await fetch(`/api/ratings/${ratingId}`, {  method: "DELETE" });
    setDeleting(false);
    if (!res.ok) {
      setError("No se pudo eliminar la reseña");
      return;
    }
    setStars(0);
    setReview("");
    setSuccess("Reseña eliminada");
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
      {error && (
        <p className="text-sm text-destructive animate-in fade-in duration-200">{error}</p>
      )}
      {success && (
        <p
          key={success}
          role="status"
          className="flex items-center gap-1.5 text-sm text-amber-500 animate-in fade-in slide-in-from-top-1 duration-300"
        >
          <CheckIcon size={14} weight="bold" /> {success}
        </p>
      )}
      {/* Guardar y eliminar en la misma fila; eliminar a la derecha, lejos del pulgar */}
      <div className="flex flex-wrap items-center gap-2">
      <Button type="submit" disabled={loading || deleting}>
        {loading ? (
          <>
            <Spinner /> Guardando...
          </>
        ) : ratingId ? (
          "Actualizar"
        ) : (
          "Publicar reseña"
        )}
      </Button>
      {ratingId && (
        <Button
          type="button"
          variant="destructive"
          onClick={handleDelete}
          disabled={loading || deleting}
          className="ml-auto"
        >
          {deleting ? (
            <>
              <Spinner /> Eliminando...
            </>
          ) : (
            "Eliminar reseña"
          )}
        </Button>
      )}
      </div>
    </form>
  );
}
