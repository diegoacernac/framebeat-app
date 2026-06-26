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
      <nav className="mx-auto flex max-w-4xl items-center justify-between gap-4 p-4">
        <Link href="/" className="text-sm font-semibold tracking-tight">
          FrameBeat
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-1">
          <Button variant="ghost" asChild>
            <Link href="/search">Buscar</Link>
          </Button>
          {user && profile ? (
            <>
              <Button variant="ghost" asChild>
                <Link href={`/u/${profile.username}`}>Mi perfil</Link>
              </Button>
              <LogoutButton />
            </>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/login">Entrar</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Registrarse</Link>
              </Button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
