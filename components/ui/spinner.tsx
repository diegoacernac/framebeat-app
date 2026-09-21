import { CircleNotchIcon } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

// Ícono girando para botones y estados de "trabajando...".
export function Spinner({ className, size = 14 }: { className?: string; size?: number }) {
  return (
    <CircleNotchIcon
      aria-hidden
      size={size}
      weight="bold"
      className={cn("animate-spin", className)}
    />
  );
}
