"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const links = [
  { href: "/anki", label: "Baralhos", match: (path: string) => path === "/anki" || path.startsWith("/anki/baralho") || path.startsWith("/anki/estudar") },
  { href: "/anki/cartoes", label: "Cartões", match: (path: string) => path.startsWith("/anki/cartoes") },
  { href: "/anki/estatisticas", label: "Estatísticas", match: (path: string) => path.startsWith("/anki/estatisticas") },
  { href: "/anki/importar", label: "Importar e exportar", match: (path: string) => path.startsWith("/anki/importar") },
];

/** Navegação interna do módulo Anki. Some durante a sessão de estudo, para não distrair. */
export function AnkiNav() {
  const pathname = usePathname();
  if (pathname.startsWith("/anki/estudar")) return null;

  return (
    <nav aria-label="Seções do Anki" className="-mx-1 mb-6 flex gap-1 overflow-x-auto px-1 pb-1">
      {links.map((link) => {
        const active = link.match(pathname);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "shrink-0 rounded-pill border-2 px-4 py-1.5 text-sm font-bold transition-colors",
              active
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-surface text-muted hover:border-sky hover:text-foreground",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
