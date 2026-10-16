import type { Metadata } from "next";
import { Suspense } from "react";
import { PdfReader } from "@/components/library/pdf-reader";
import { serverApi } from "@/lib/api-server";
import type { Book } from "@/lib/book-types";

export const metadata: Metadata = { title: "Leitor" };

export default function ReaderPage({ params }: PageProps<"/biblioteca/[bookId]">) {
  return (
    <Suspense fallback={<p className="p-8 text-center font-semibold text-muted">Abrindo o livro…</p>}>
      <Reader params={params} />
    </Suspense>
  );
}

async function Reader({ params }: { params: PageProps<"/biblioteca/[bookId]">["params"] }) {
  const { bookId } = await params;
  const { book } = await serverApi<{ book: Book }>(`/api/books/${bookId}`, `/biblioteca/${bookId}`);
  return <PdfReader book={book} />;
}
