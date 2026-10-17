import { Suspense } from "react";
import { AnkiNav } from "@/components/anki/anki-nav";
import { AppHeader } from "@/components/app-header";

export default function AnkiLayout({ children }: LayoutProps<"/anki">) {
  return (
    <div className="mx-auto w-full max-w-5xl px-5 pb-16">
      <AppHeader />
      {/* usePathname() depende da rota: o espaço reservado evita salto de layout */}
      <Suspense fallback={<div aria-hidden className="mb-6 h-10" />}>
        <AnkiNav />
      </Suspense>
      {children}
    </div>
  );
}
