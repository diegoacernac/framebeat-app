"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChartBar,
  House,
  ListBullets,
  Popcorn,
  UserCircle,
  type Icon,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  shortLabel: string; // para la barra inferior, donde hay poco espacio
  icon: Icon;
  // Rutas que también cuentan como "esta sección" (ej. una ficha de película
  // se abre desde el buscador de Inicio)
  matches: (pathname: string) => boolean;
};

function getNavItems(username: string): NavItem[] {
  return [
    {
      href: "/",
      label: "Inicio",
      shortLabel: "Inicio",
      icon: House,
      matches: (p) =>
        p === "/" || /^\/(movies|series|albums|search)(\/|$)/.test(p),
    },
    {
      href: "/discover",
      label: "¿Qué vemos?",
      shortLabel: "¿Qué vemos?",
      icon: Popcorn,
      matches: (p) => p.startsWith("/discover"),
    },
    {
      href: "/lists",
      label: "Listas",
      shortLabel: "Listas",
      icon: ListBullets,
      matches: (p) => p.startsWith("/lists"),
    },
    {
      href: "/stats",
      label: "Estadísticas",
      shortLabel: "Estadísticas",
      icon: ChartBar,
      matches: (p) => p.startsWith("/stats"),
    },
    {
      href: `/u/${username}`,
      label: "Perfil",
      shortLabel: "Perfil",
      icon: UserCircle,
      // Solo tu propio perfil; el de tu pareja no marca "Perfil"
      matches: (p) => p === `/u/${username}`,
    },
  ];
}

// Enlaces del header, solo en pantallas medianas en adelante
export function DesktopNav({ username }: { username: string }) {
  const pathname = usePathname();

  return (
    <div className="hidden items-center gap-0.5 md:flex">
      {getNavItems(username).map((item) => {
        const active = item.matches(pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "px-3 py-1.5 text-sm transition-colors",
              active
                ? "bg-muted font-medium text-amber-500"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}

// Barra fija abajo, solo en móvil. El padding que evita que tape el contenido
// está en globals.css (body:has([data-bottom-nav])).
export function BottomNav({ username }: { username: string }) {
  const pathname = usePathname();

  return (
    <nav
      data-bottom-nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="grid grid-cols-5">
        {getNavItems(username).map((item) => {
          const active = item.matches(pathname);
          const ItemIcon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group flex h-16 flex-col items-center justify-center gap-1 text-[10px] transition-colors",
                  active ? "text-amber-500" : "text-muted-foreground active:text-foreground"
                )}
              >
                <ItemIcon
                  size={24}
                  weight={active ? "fill" : "regular"}
                  // Pequeño "salto" al activarse y al tocar, para que se sienta táctil
                  className={cn(
                    "transition-transform duration-200 ease-out",
                    active ? "scale-110" : "scale-100",
                    "group-active:scale-90"
                  )}
                />
                {/* tracking-tighter: "Estadísticas" entra aun en pantallas de 360px */}
                <span className="max-w-full truncate px-0.5 leading-none tracking-tighter">{item.shortLabel}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
