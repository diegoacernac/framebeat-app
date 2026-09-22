"use client";

import { Star } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useState } from "react";

type Props = {
  value: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  size?: number;
};

export function StarRating({
  value,
  onChange,
  readOnly = false,
  size = 24,
}: Props) {
  const [hovered, setHovered] = useState(0);
  const display = hovered || value;

  const stars = [1, 2, 3, 4, 5];

  // Solo lectura: una sola imagen con nombre ("4 de 5 estrellas"), no cinco
  // botones deshabilitados sin texto que los lectores de pantalla no entienden
  if (readOnly) {
    return (
      <div className="flex gap-1" role="img" aria-label={`${value} de 5 estrellas`}>
        {stars.map((star) => (
          <Star
            key={star}
            size={size}
            weight={star <= value ? "fill" : "regular"}
            className={star <= value ? "text-yellow-500" : "text-muted-foreground"}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Calificación" onMouseLeave={() => setHovered(0)}>
      {stars.map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={star === value}
          aria-label={`${star} ${star === 1 ? "estrella" : "estrellas"}`}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => setHovered(star)}
          className="transition-transform duration-150 hover:scale-110 active:scale-125"
        >
          <Star
            size={size}
            weight={star <= value ? "fill" : "regular"}
            className={cn(
              "transition-colors duration-150",
              star <= display
                ? "text-yellow-500"
                : "text-muted-foreground"
            )}
          />
        </button>
      ))}
    </div>
  );
}
