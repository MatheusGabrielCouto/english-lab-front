import { Suspense } from "react";
import { ApiStatus, ApiStatusFallback } from "@/components/api-status";
import { Mascot } from "@/components/mascot";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const levels = [
  { code: "A1", name: "Iniciante", tone: "primary", text: "Alfabeto, cumprimentos, verbo to be e rotina." },
  { code: "A2", name: "Básico", tone: "sky", text: "Passado, futuro simples e conversas do dia a dia." },
  { code: "B1", name: "Intermediário", tone: "butter", text: "Present perfect, modais e phrasal verbs." },
  { code: "B2", name: "Intermediário+", tone: "coral", text: "Condicionais, voz passiva e escrita formal." },
  { code: "C1", name: "Avançado", tone: "lavender", text: "Idioms, collocations e textos acadêmicos." },
  { code: "C2", name: "Proficiente", tone: "primary", text: "Nuances, estilo e fluência quase nativa." },
] as const;

const features = [
  {
    title: "Trilha de aulas",
    tone: "primary",
    text: "Do alfabeto ao C2, com exercícios curtos, explicação antes da prática, XP e sequência diária.",
  },
  {
    title: "Teste de nível",
    tone: "lavender",
    text: "30 perguntas, uma por vez, e a trilha abre no ponto certo para você. Dá para refazer quando quiser.",
  },
  {
    title: "Anki integrado",
    tone: "sky",
    text: "Flashcards com repetição espaçada (FSRS), cartões cloze e importação dos seus baralhos .apkg.",
  },
  {
    title: "Biblioteca de livros",
    tone: "butter",
    text: "Leia PDFs em inglês dentro do site. Toque numa palavra e ela vira flashcard com a frase do livro.",
  },
  {
    title: "Checklist diário",
    tone: "primary",
    text: "O que fazer hoje: lição, Anki, leitura, diário e entrevista se marcam sozinhos. Crie os seus itens e acompanhe o mês.",
  },
  {
    title: "Diário em inglês",
    tone: "coral",
    text: "Escreva um pouco todo dia, com um tema sugerido. Peça a correção: os erros ficam marcados no seu texto, com explicação em português.",
  },
  {
    title: "Meta de estudo",
    tone: "lavender",
    text: "Quer trabalhar no exterior? Escolha o nível e a data e veja quantos minutos estudar por dia, com a barra de progresso até lá.",
  },
  {
    title: "Entrevista técnica",
    tone: "sky",
    text: "46 perguntas de entrevista para devs. Responda em inglês e receba feedback do seu inglês e do conteúdo técnico.",
  },
] as const;

export default function Home() {
  return (
    <>
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5">
        <a href="#" className="flex items-center gap-3 font-display text-2xl font-semibold">
          <span className="grid size-10 place-items-center rounded-2xl bg-butter text-xl text-ink shadow-[0_3px_0_0_var(--color-butter-edge)]">
            E
          </span>
          English Lab
        </a>
        <nav aria-label="Principal" className="hidden items-center gap-7 font-semibold text-muted sm:flex">
          <a className="transition-colors hover:text-foreground" href="#trilha">Trilha</a>
          <a className="transition-colors hover:text-foreground" href="#recursos">Recursos</a>
        </nav>
        <div className="flex items-center gap-3">
          <ButtonLink href="/entrar" variant="ghost">Entrar</ButtonLink>
          <ButtonLink href="/cadastrar" className="hidden sm:inline-flex">Criar conta</ButtonLink>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto grid w-full max-w-6xl items-center gap-10 px-5 pb-16 pt-8 md:grid-cols-[1.1fr_0.9fr] md:pt-16">
          <div>
            <p className="mb-4 inline-block rounded-pill bg-primary-soft px-4 py-1.5 text-sm font-bold text-primary">
              Do A1 ao C2, no seu ritmo
            </p>
            <h1 className="font-display text-5xl font-semibold leading-[1.05] text-balance md:text-6xl">
              Aprenda inglês de um jeito leve e que dá resultado.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted text-pretty">
              Aulas curtas, flashcards que você não esquece, livros para ler de
              verdade e um diário para escrever todo dia. Tudo conectado, com
              checklist, meta e preparação para entrevistas no exterior.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <ButtonLink href="/cadastrar" size="lg">Começar agora</ButtonLink>
              <ButtonLink href="#trilha" size="lg" variant="ghost">Conhecer a trilha</ButtonLink>
            </div>
          </div>

          <div className="mx-auto w-64 text-foreground md:w-80">
            <Mascot className="motion-safe:animate-float" />
          </div>
        </section>

        <section id="trilha" className="mx-auto w-full max-w-6xl scroll-mt-6 px-5 py-14">
          <h2 className="font-display text-3xl font-semibold md:text-4xl">Sua trilha, nível por nível</h2>
          <p className="mt-2 max-w-2xl text-muted">
            Faça o teste de nível e comece de onde faz sentido. Cada nível tem
            unidades, lições e um baralho próprio de vocabulário.
          </p>
          <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {levels.map((level, index) => (
              <li key={level.code}>
                <Card
                  tone={level.tone}
                  className="h-full transition-transform duration-200 ease-out hover:-translate-y-1"
                >
                  <div className="flex items-baseline justify-between">
                    <span className="font-display text-4xl font-semibold">{level.code}</span>
                    <span className="text-sm font-bold text-muted">{level.name}</span>
                  </div>
                  <p className="mt-3 text-pretty">{level.text}</p>
                  <Progress
                    className="mt-5"
                    value={index === 0 ? 8 : 0}
                    label={`Progresso no nível ${level.code}`}
                  />
                </Card>
              </li>
            ))}
          </ul>
        </section>

        <section id="recursos" className="mx-auto w-full max-w-6xl scroll-mt-6 px-5 py-14">
          <h2 className="font-display text-3xl font-semibold md:text-4xl">Tudo o que você precisa num lugar só</h2>
          <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <li key={feature.title}>
                <Card tone={feature.tone} className="h-full">
                  <h3 className="font-display text-2xl font-semibold">{feature.title}</h3>
                  <p className="mt-3 text-pretty">{feature.text}</p>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="border-t-2 border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-6 text-sm text-muted">
          <span>© 2026 English Lab</span>
          <Suspense fallback={<ApiStatusFallback />}>
            <ApiStatus />
          </Suspense>
        </div>
      </footer>
    </>
  );
}
