"use client";

import { Star } from "@phosphor-icons/react";

type Props = {
  value: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
};

export function StarRating({ value, onChange, readOnly = false }: Props) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(star)}
          className="disabled:cursor-default"        
        >
          <Star
            size={24}
            weight={star <= value ? "fill" : "regular"}
            className={star <= value ? "text-yellow-500" : "text-muted-foreground"}
          />
        </button>
      ))}
    </div>
  );
}