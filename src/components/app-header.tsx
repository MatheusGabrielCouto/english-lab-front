import Link from "next/link";
import { LogoutButton } from "@/components/auth/logout-button";

const links = [
  { href: "/painel", label: "Painel" },
  { href: "/anki", label: "Anki" },
  { href: "/biblioteca", label: "Biblioteca" },
];

/** Cabeçalho das áreas logadas. Estático: não depende da sessão. */
export function AppHeader() {
  return (
    <header className="flex items-center justify-between gap-4 py-5">
      <div className="flex items-center gap-6">
        <Link
          href="/painel"
          className="flex items-center gap-3 font-display text-2xl font-semibold"
        >
          <span className="grid size-10 place-items-center rounded-2xl bg-butter text-xl text-ink shadow-[0_3px_0_0_var(--color-butter-edge)]">
            E
          </span>
          <span className="hidden sm:inline">English Lab</span>
        </Link>
        <nav aria-label="Principal" className="flex items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-pill px-4 py-2 font-semibold text-muted transition-colors hover:bg-surface-soft hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <LogoutButton />
    </header>
  );
}
