import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "./LogoutButton";

type Profile = {
  username: string;
};

type HeaderProps = {
  user: User | null;
  profile: Profile | null;
};

export function Header({ user, profile }: HeaderProps) {
  return (
    <header className="border-b">
      <nav className="mx-auto flex max-w-4xl items-center justify-between gap-2 p-3 md:p-4">
        <Link href="/" className="shrink-0 text-sm font-semibold tracking-tight">
          FrameBeat
        </Link>
        <div className="flex items-center gap-0.5 overflow-x-auto">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/search">Buscar</Link>
          </Button>
          {user && profile ? (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/u/${profile.username}`}>Perfil</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/lists">Listas</Link>
              </Button>
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
  );
}
