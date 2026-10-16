import type { Metadata } from "next";
import { Suspense } from "react";
import { AppHeader } from "@/components/app-header";
import { LibraryBrowser } from "@/components/library/library-browser";
import { ButtonLink } from "@/components/ui/button";
import { serverApi } from "@/lib/api-server";
import type { Book } from "@/lib/book-types";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Biblioteca" };

export default function LibraryPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-5 pb-16">
      <AppHeader />
      <main>
        <Suspense fallback={<Header isAdmin={false} />}>
          <LibraryHeader />
        </Suspense>
        <Suspense fallback={<div aria-busy="true" className="mt-8 h-96 animate-pulse rounded-card bg-surface-soft" />}>
          <Shelf />
        </Suspense>
      </main>
    </div>
  );
}

function Header({ isAdmin }: { isAdmin: boolean }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-4xl font-semibold md:text-5xl">Biblioteca</h1>
        <p className="mt-2 max-w-xl text-lg text-muted text-pretty">
          Leia livros em inglês no seu nível. Sua página fica salva e você continua de onde parou.
        </p>
      </div>
      {isAdmin && (
        <ButtonLink href="/admin/livros" variant="ghost">
          Gerenciar livros
        </ButtonLink>
      )}
    </div>
  );
}

async function LibraryHeader() {
  const user = await getCurrentUser();
  return <Header isAdmin={user?.role === "ADMIN"} />;
}

async function Shelf() {
  const [{ books }, user] = await Promise.all([
    serverApi<{ books: Book[] }>("/api/books", "/biblioteca"),
    getCurrentUser(),
  ]);
  return (
    <div className="mt-8">
      <LibraryBrowser books={books} isAdmin={user?.role === "ADMIN"} />
    </div>
  );
}
