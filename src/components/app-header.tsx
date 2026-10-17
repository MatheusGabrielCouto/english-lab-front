import Link from "next/link";
import { LogoutButton } from "@/components/auth/logout-button";

const links = [
  { href: "/painel", label: "Painel" },
  { href: "/trilha", label: "Trilha" },
  { href: "/anki", label: "Anki" },
  { href: "/biblioteca", label: "Biblioteca" },
];

/** Cabeçalho das áreas logadas. Estático: não depende da sessão. */
export function AppHeader() {
  return (
    <header className="flex flex-wrap items-center gap-x-6 gap-y-1 py-5">
      <Link
        href="/painel"
        className="order-1 flex items-center gap-3 font-display text-2xl font-semibold"
      >
        <span className="grid size-10 place-items-center rounded-2xl bg-butter text-xl text-ink shadow-[0_3px_0_0_var(--color-butter-edge)]">
          E
        </span>
        <span className="hidden sm:inline">English Lab</span>
      </Link>
      {/* no celular o menu desce para uma segunda linha, para caber todos os links */}
      <nav
        aria-label="Principal"
        className="order-3 -mx-3 flex w-full items-center gap-1 overflow-x-auto sm:order-2 sm:mx-0 sm:w-auto"
      >
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-pill px-4 py-2 font-semibold whitespace-nowrap text-muted transition-colors hover:bg-surface-soft hover:text-foreground"
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="order-2 ml-auto sm:order-3">
        <LogoutButton />
      </div>
    </header>
  );
}
