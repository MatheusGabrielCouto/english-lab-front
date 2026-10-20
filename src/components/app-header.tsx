import Link from "next/link";
import { Suspense } from "react";
import { AppNav, AppNavFallback } from "@/components/app-nav";
import { LogoutButton } from "@/components/auth/logout-button";

/**
 * Cabeçalho das áreas logadas. Estático: não depende da sessão.
 * Uma linha só: logo, menu (em grupos no computador, um botão "Menu" no celular) e o botão Sair, que nunca desce.
 */
export function AppHeader() {
  return (
    <header className="relative flex items-center gap-x-3 py-5 md:gap-x-5">
      <Link href="/painel" className="flex shrink-0 items-center gap-3 font-display text-2xl font-semibold">
        <span className="grid size-10 place-items-center rounded-2xl bg-butter text-xl text-ink shadow-[0_3px_0_0_var(--color-butter-edge)]">E</span>
        <span className="hidden xl:inline">English Lab</span>
      </Link>
      <Suspense fallback={<AppNavFallback />}>
        <AppNav />
      </Suspense>
      <div className="shrink-0">
        <LogoutButton />
      </div>
    </header>
  );
}
