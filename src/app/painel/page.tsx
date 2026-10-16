import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AppHeader } from "@/components/app-header";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Painel" };

const areas = [
  { title: "Trilha de aulas", tone: "primary", text: "Do A1 ao C2, lição por lição.", href: null },
  { title: "Anki", tone: "sky", text: "Flashcards com repetição espaçada.", href: "/anki" },
  { title: "Biblioteca", tone: "butter", text: "Livros em inglês para ler e salvar palavras.", href: "/biblioteca" },
] as const;

export default function DashboardPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-6">
      <AppHeader />

      {/* a sessão é lida na requisição, então fica atrás de um Suspense */}
      <Suspense fallback={<p className="mt-12 text-muted">Carregando seu painel…</p>}>
        <Welcome />
      </Suspense>
    </div>
  );
}

async function Welcome() {
  const user = await getCurrentUser();
  // token "fresco" para o proxy, mas recusado pelo backend: limpa a sessão
  if (!user) redirect("/api/auth/session?next=%2Fpainel&reset=1");

  const firstName = user.name.split(" ")[0];

  return (
    <main className="mt-12">
      <p className="inline-block rounded-pill bg-primary-soft px-4 py-1.5 text-sm font-bold text-primary">
        {user.role === "ADMIN" ? "Administrador" : "Aluno"}
      </p>
      <h1 className="mt-4 font-display text-4xl font-semibold text-balance md:text-5xl">
        Olá, {firstName}! 👋
      </h1>
      <p className="mt-3 max-w-xl text-lg text-muted text-pretty">
        Por onde vamos começar hoje?
      </p>

      <ul className="mt-10 grid gap-5 md:grid-cols-3">
        {areas.map((item) => (
          <li key={item.title}>
            <Card tone={item.tone} className="h-full">
              <h2 className="font-display text-2xl font-semibold">{item.title}</h2>
              <p className="mt-3 text-pretty">{item.text}</p>
              {item.href ? (
                <ButtonLink href={item.href} className="mt-5">Abrir</ButtonLink>
              ) : (
                <p className="mt-4 text-sm font-bold text-muted">Em breve</p>
              )}
            </Card>
          </li>
        ))}
      </ul>
    </main>
  );
}
