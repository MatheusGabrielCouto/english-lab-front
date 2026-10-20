"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

const links = [
  { href: "/painel", label: "Painel" },
  { href: "/hoje", label: "Hoje" },
  { href: "/trilha", label: "Trilha" },
  { href: "/anki", label: "Anki" },
  { href: "/biblioteca", label: "Biblioteca" },
  { href: "/diario", label: "Diário" },
  { href: "/motivacao", label: "Motivação" },
  { href: "/meta", label: "Meta" },
  { href: "/entrevista", label: "Entrevista" },
];

/** Menu principal, com a seção atual marcada. Rola na horizontal se faltar espaço. */
export function AppNav() {
  const pathname = usePathname();
  const active = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    active.current?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [pathname]);

  return <NavLinks pathname={pathname} active={active} />;
}

/** O mesmo menu sem a seção marcada: aparece enquanto a rota atual ainda não é conhecida. */
export function AppNavFallback() {
  return <NavLinks pathname="" />;
}

function NavLinks({ pathname, active }: { pathname: string; active?: React.Ref<HTMLAnchorElement> }) {
  return (
    <nav
      aria-label="Principal"
      className="order-3 -mx-3 flex w-full items-center gap-1 overflow-x-auto px-3 [scrollbar-width:none] sm:order-2 sm:mx-0 sm:w-auto sm:px-0 [&::-webkit-scrollbar]:hidden"
    >
      {links.map((link) => {
        const current = pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            ref={current ? active : undefined}
            href={link.href}
            aria-current={current ? "page" : undefined}
            className={cn(
              "rounded-pill px-4 py-2 font-semibold whitespace-nowrap transition-colors",
              current ? "bg-surface-soft text-foreground" : "text-muted hover:bg-surface-soft hover:text-foreground",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
