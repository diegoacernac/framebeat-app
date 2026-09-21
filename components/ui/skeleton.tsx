import { cn } from "@/lib/utils";
import React from "react";

export function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      aria-hidden
      className={cn("animate-pulse bg-muted", className)}
      {...props}
    ></div>
  );
}