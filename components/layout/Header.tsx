import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "./LogoutButton";
import { BottomNav, DesktopNav } from "./MainNav";

type Profile = {
  username: string;
};

type HeaderProps = {
  user: User | null;
  profile: Profile | null;
};

export function Header({ user, profile }: HeaderProps) {
  const loggedIn = user && profile;

  return (
    <>
      <header className="border-b">
        {/* Mismo ancho y margen lateral que el <main> de cada página: el logo
            queda alineado con los títulos */}
        <nav className="mx-auto flex max-w-4xl items-center justify-between gap-2 px-4 py-3 sm:px-8 md:py-4 lg:max-w-6xl">
          <Link href="/" className="shrink-0 text-sm font-semibold tracking-tight">
            FrameBeat
          </Link>
          <div className="flex items-center gap-0.5">
            {loggedIn ? (
              <>
                <DesktopNav username={profile.username} />
                <LogoutButton />
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login">Entrar</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/register">Registrarse</Link>
                </Button>
              </>
            )}
          </div>
        </nav>
      </header>
      {loggedIn && <BottomNav username={profile.username} />}
    </>
  );
}
