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

  return (
    <div className="flex gap-1" onMouseLeave={() => !readOnly && setHovered(0)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readOnly && setHovered(star)}
          className={cn(
            "transition-transform duration-150 disabled:cursor-default",
            !readOnly && "hover:scale-110 active:scale-125"
          )}
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