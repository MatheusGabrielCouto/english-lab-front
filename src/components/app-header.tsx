import Link from "next/link";
import { Suspense } from "react";
import { AppNav, AppNavFallback } from "@/components/app-nav";
import { LogoutButton } from "@/components/auth/logout-button";

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
      <Suspense fallback={<AppNavFallback />}>
        <AppNav />
      </Suspense>
      <div className="order-2 ml-auto sm:order-3">
        <LogoutButton />
      </div>
    </header>
  );
}
