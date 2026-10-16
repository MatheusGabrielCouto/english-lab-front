import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AppHeader } from "@/components/app-header";
import { BookAdmin } from "@/components/library/book-admin";
import { serverApi } from "@/lib/api-server";
import type { Book } from "@/lib/book-types";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Gerenciar livros" };

export default function AdminBooksPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-5 pb-16">
      <AppHeader />
      <main>
        <Link href="/biblioteca" className="font-semibold text-muted transition-colors hover:text-foreground">
          ← Biblioteca
        </Link>
        <h1 className="mt-3 font-display text-4xl font-semibold md:text-5xl">Gerenciar livros</h1>
        <p className="mt-2 max-w-xl text-lg text-muted text-pretty">
          Envie PDFs em inglês e escolha o nível de cada um. O arquivo vai direto para o armazenamento privado.
        </p>
        <div className="mt-8">
          <Suspense fallback={<div aria-busy="true" className="h-96 animate-pulse rounded-card bg-surface-soft" />}>
            <Admin />
          </Suspense>
        </div>
      </main>
    </div>
  );
}

async function Admin() {
  const user = await getCurrentUser();
  // a tela só existe para administradores (a API também recusa os demais)
  if (user?.role !== "ADMIN") notFound();

  const { books } = await serverApi<{ books: Book[] }>("/api/books?includePending=true", "/admin/livros");
  return <BookAdmin initialBooks={books} />;
}
