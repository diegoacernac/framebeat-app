"use client";

import { CheckIcon, PlusIcon } from "@phosphor-icons/react/dist/ssr";
import { Button } from "../ui/button";
import { Spinner } from "../ui/spinner";
import { cn } from "@/lib/utils";

// Botón "Añadir" de los resultados y sugerencias: pasa a "✓ En la lista"
// y se queda así, para seguir eligiendo otras sin perder de vista cuáles ya están
export function AddMediaButton({
  inList,
  adding,
  onAdd,
  compact = false,
}: {
  inList: boolean;
  adding: boolean;
  onAdd: () => void;
  compact?: boolean;
}) {
  if (inList) {
    return (
      <span
        className={cn(
          "flex shrink-0 items-center justify-center gap-1 text-xs font-medium text-amber-500",
          compact ? "size-7 bg-black/75" : "min-w-20"
        )}
        aria-label="En la lista"
      >
        <CheckIcon size={12} weight="bold" />
        {!compact && "En la lista"}
      </span>
    );
  }

  return (
    <Button
      type="button"
      size={compact ? "icon-sm" : "sm"}
      disabled={adding}
      onClick={onAdd}
      aria-label={compact ? "Añadir a la lista" : undefined}
      className={compact ? undefined : "min-w-20"}
    >
      {adding ? (
        <>
          <Spinner size={12} />
          {!compact && " Añadiendo"}
        </>
      ) : compact ? (
        <PlusIcon size={14} weight="bold" />
      ) : (
        "Añadir"
      )}
    </Button>
  );
}

export function AddFeedback({
  feedback,
}: {
  feedback: { type: "ok" | "error"; text: string } | null;
}) {
  if (!feedback) return null;
  return (
    <p
      key={feedback.text}
      role="status"
      className={cn(
        "flex items-center gap-1.5 text-xs animate-in fade-in slide-in-from-top-1 duration-200",
        feedback.type === "ok" ? "text-amber-500" : "text-destructive"
      )}
    >
      {feedback.type === "ok" && <CheckIcon size={12} weight="bold" />}
      {feedback.text}
    </p>
  );
}
