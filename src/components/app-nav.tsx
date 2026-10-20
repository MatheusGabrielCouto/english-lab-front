"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

type NavLink = { href: string; label: string; hint: string };
type NavEntry = { type: "link"; link: NavLink } | { type: "group"; label: string; links: NavLink[] };

/** Os módulos ficam em grupos: o menu cabe numa linha só, não importa quantos módulos existam. */
const NAV: NavEntry[] = [
  { type: "link", link: { href: "/painel", label: "Painel", hint: "Seu resumo do dia" } },
  { type: "link", link: { href: "/hoje", label: "Hoje", hint: "Checklist diário" } },
  {
    type: "group",
    label: "Aprender",
    links: [
      { href: "/trilha", label: "Trilha", hint: "Aulas do A1 ao C2" },
      { href: "/anki", label: "Anki", hint: "Flashcards e revisões" },
      { href: "/biblioteca", label: "Biblioteca", hint: "Livros em PDF" },
    ],
  },
  {
    type: "group",
    label: "Praticar",
    links: [
      { href: "/diario", label: "Diário", hint: "Escrever em inglês" },
      { href: "/entrevista", label: "Entrevista", hint: "Perguntas para devs" },
    ],
  },
  {
    type: "group",
    label: "Meu caminho",
    links: [
      { href: "/meta", label: "Meta", hint: "Nível e prazo" },
      { href: "/motivacao", label: "Motivação", hint: "Seu mural" },
    ],
  },
];

const isCurrent = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);
const groupIsCurrent = (pathname: string, links: NavLink[]) => links.some((link) => isCurrent(pathname, link.href));

/** Menu principal. Chama `usePathname`, então fica atrás de um Suspense (ver `AppHeader`). */
export function AppNav() {
  return <NavMenu pathname={usePathname()} />;
}

/** O mesmo menu sem a seção marcada: aparece enquanto a rota atual ainda não é conhecida. */
export function AppNavFallback() {
  return <NavMenu pathname="" />;
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg aria-hidden viewBox="0 0 12 12" className={cn("size-3 transition-transform", open && "rotate-180")} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 4.5 6 8l3.5-3.5" />
    </svg>
  );
}

/**
 * Computador: links e grupos numa linha só, com os grupos abrindo uma lista.
 * Celular: um botão "Menu" que abre todos os links, em grupos, logo abaixo do cabeçalho.
 */
function NavMenu({ pathname }: { pathname: string }) {
  // o menu aberto vale só para a página em que foi aberto: ao navegar, fecha sozinho
  const [open, setOpen] = useState<{ id: string; path: string } | null>(null);
  const openId = open?.path === pathname ? open.id : null;
  const root = useRef<HTMLDivElement>(null);

  const toggle = (id: string) => setOpen(openId === id ? null : { id, path: pathname });

  useEffect(() => {
    if (!openId) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(null);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(null);
      root.current?.querySelector<HTMLButtonElement>(`[data-nav-trigger="${openId}"]`)?.focus();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [openId]);

  const all = NAV.flatMap((entry) => (entry.type === "link" ? [entry.link] : entry.links));
  const currentLabel = all.find((link) => isCurrent(pathname, link.href))?.label;

  return (
    <div ref={root} className="contents">
      {/* computador */}
      <nav aria-label="Principal" className="hidden min-w-0 flex-1 items-center gap-1 md:flex">
        {NAV.map((entry) => {
          if (entry.type === "link") {
            const current = isCurrent(pathname, entry.link.href);
            return (
              <Link
                key={entry.link.href}
                href={entry.link.href}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "rounded-pill px-4 py-2 font-semibold whitespace-nowrap transition-colors",
                  current ? "bg-surface-soft text-foreground" : "text-muted hover:bg-surface-soft hover:text-foreground",
                )}
              >
                {entry.link.label}
              </Link>
            );
          }
          const active = groupIsCurrent(pathname, entry.links);
          const isOpen = openId === entry.label;
          return (
            <div key={entry.label} className="relative">
              <button
                data-nav-trigger={entry.label}
                type="button"
                aria-expanded={isOpen}
                aria-controls={`menu-${entry.label}`}
                onClick={() => toggle(entry.label)}
                className={cn(
                  "flex items-center gap-1.5 rounded-pill px-4 py-2 font-semibold whitespace-nowrap transition-colors",
                  active || isOpen ? "bg-surface-soft text-foreground" : "text-muted hover:bg-surface-soft hover:text-foreground",
                )}
              >
                {entry.label}
                <Chevron open={isOpen} />
              </button>
              {isOpen && (
                <ul id={`menu-${entry.label}`} className="absolute top-full left-0 z-30 mt-2 flex w-64 flex-col gap-1 rounded-card border-2 border-border bg-surface p-2 shadow-[0_4px_0_0_var(--color-border)]">
                  {entry.links.map((link) => {
                    const current = isCurrent(pathname, link.href);
                    return (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          aria-current={current ? "page" : undefined}
                          className={cn("block rounded-2xl px-4 py-2.5 transition-colors hover:bg-surface-soft", current && "bg-surface-soft")}
                        >
                          <span className="block font-bold">{link.label}</span>
                          <span className="block text-sm text-muted">{link.hint}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </nav>

      {/* celular */}
      <button
        data-nav-trigger="mobile"
        type="button"
        aria-expanded={openId === "mobile"}
        aria-controls="menu-mobile"
        onClick={() => toggle("mobile")}
        className="ml-auto flex h-11 items-center gap-2 rounded-pill border-2 border-border bg-surface px-4 font-display font-semibold md:hidden"
      >
        <svg aria-hidden viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          {openId === "mobile" ? <path d="M5 5l10 10M15 5 5 15" /> : <path d="M3 6h14M3 10h14M3 14h14" />}
        </svg>
        <span>{currentLabel ?? "Menu"}</span>
      </button>
      {openId === "mobile" && (
        <nav id="menu-mobile" aria-label="Principal" className="absolute inset-x-0 top-full z-30 mt-1 flex max-h-[75dvh] flex-col gap-4 overflow-y-auto rounded-card border-2 border-border bg-surface p-4 shadow-[0_4px_0_0_var(--color-border)] md:hidden">
          {NAV.map((entry) => {
            const links = entry.type === "link" ? [entry.link] : entry.links;
            return (
              <div key={entry.type === "link" ? entry.link.href : entry.label}>
                {entry.type === "group" && <p className="px-3 pb-1 text-xs font-bold tracking-wide text-muted uppercase">{entry.label}</p>}
                <ul className="flex flex-col gap-1">
                  {links.map((link) => {
                    const current = isCurrent(pathname, link.href);
                    return (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          aria-current={current ? "page" : undefined}
                          className={cn("flex items-baseline justify-between gap-3 rounded-2xl px-3 py-3 transition-colors hover:bg-surface-soft", current && "bg-surface-soft")}
                        >
                          <span className="font-bold">{link.label}</span>
                          <span className="text-sm text-muted">{link.hint}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>
      )}
    </div>
  );
}
