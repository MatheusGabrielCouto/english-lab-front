import type { Metadata } from "next";
import { Suspense } from "react";
import { ExportPanel } from "@/components/anki/export-panel";
import { ImportForm } from "@/components/anki/import-form";
import { serverApi } from "@/lib/api-server";
import type { Deck } from "@/lib/anki-types";

export const metadata: Metadata = { title: "Importar e exportar" };

export default function ImportPage() {
  return (
    <main>
      <h1 className="font-display text-4xl font-semibold md:text-5xl">Importar e exportar</h1>
      <p className="mt-2 max-w-xl text-lg text-muted text-pretty">
        Traga seus baralhos do Anki ou de uma planilha, e leve os seus de volta quando quiser.
      </p>
      <Suspense fallback={<div aria-busy="true" className="mt-8 h-96 animate-pulse rounded-card bg-surface-soft" />}>
        <Content />
      </Suspense>
    </main>
  );
}

async function Content() {
  const { decks } = await serverApi<{ decks: Deck[] }>("/api/anki/decks", "/anki/importar");
  const options = decks.map((deck) => ({ id: deck.id, fullName: deck.fullName }));

  return (
    <div className="mt-8 flex flex-col gap-10">
      <section aria-labelledby="import-title" className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <h2 id="import-title" className="font-display text-2xl font-semibold">
            Importar
          </h2>
          <div className="mt-4">
            <ImportForm decks={options} />
          </div>
        </div>

        <aside className="rounded-card border-2 border-border bg-surface-soft p-6 text-sm">
          <h3 className="font-display text-lg font-semibold">Como preparar o arquivo</h3>
          <div className="mt-3 flex flex-col gap-4 text-pretty">
            <div>
              <p className="font-bold">Do Anki (.apkg)</p>
              <p className="mt-1 text-muted">
                No Anki: <em>Arquivo › Exportar</em>, formato <em>Pacote de baralho Anki (.apkg)</em> e marque{" "}
                <strong className="text-foreground">“Suporte a versões antigas do Anki”</strong>. Importamos o texto
                dos cartões; imagens e áudios ficam de fora, e o progresso recomeça do zero.
              </p>
            </div>
            <div>
              <p className="font-bold">De uma planilha (.csv ou .tsv)</p>
              <p className="mt-1 text-muted">
                Uma linha por cartão. Sem cabeçalho, as colunas são <em>frente, verso, dica, tags</em>. Com cabeçalho,
                use: <code>baralho, tipo, frente, verso, extra, tags</code>. Para lacunas, escreva{" "}
                <code>{"{{c1::palavra}}"}</code> na frente.
              </p>
            </div>
          </div>
        </aside>
      </section>

      <section aria-labelledby="export-title" className="rounded-card border-2 border-border bg-surface p-6 shadow-[0_4px_0_0_var(--color-border)]">
        <h2 id="export-title" className="font-display text-2xl font-semibold">
          Exportar
        </h2>
        <p className="mb-5 mt-1 text-sm text-muted text-pretty">
          O arquivo .apkg abre no Anki (computador e celular). O progresso de estudo não vai junto: os cartões chegam como novos.
        </p>
        <ExportPanel decks={options} />
      </section>
    </div>
  );
}
