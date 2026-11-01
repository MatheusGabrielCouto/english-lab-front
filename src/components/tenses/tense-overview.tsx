import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import {
  answersText,
  LEVEL_CLASS,
  LEVEL_LABEL,
  missesText,
  percentText,
  SOURCE_LABEL,
  TENSE_NAME,
  TENSE_ORDER,
  TENSE_STYLE,
} from "@/lib/tense-format";
import type { Tally, TenseRow, TensesOverview, WeakSpot } from "@/lib/tense-types";

/** "Meus tempos verbais": o que fazer agora, o acerto de cada tempo e as frases que mais derrubam. */
export function TenseOverview({ overview }: { overview: TensesOverview }) {
  const rows = TENSE_ORDER.map((tense) => overview.tenses.find((row) => row.tense === tense)).filter((row): row is TenseRow => row !== undefined);
  const anyData = rows.some((row) => row.answers > 0);
  const anyCards = rows.some((row) => row.cards > 0);

  return (
    <div className="mt-6 flex flex-col gap-8">
      <Card tone={overview.suggestion.tense ? "coral" : "primary"} className="flex flex-col gap-3">
        <p className="text-sm font-bold text-muted">
          {overview.suggestion.tense ? `O que fazer agora · ${TENSE_NAME[overview.suggestion.tense]}` : "O que fazer agora"}
        </p>
        <p className="font-display text-xl leading-snug font-semibold text-balance md:text-2xl">{overview.suggestion.text}</p>
        {!anyCards && (
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/anki/importar" variant="primary">
              Importar o baralho
            </ButtonLink>
            <ButtonLink href="/trilha" variant="ghost">
              Ir para a trilha
            </ButtonLink>
          </div>
        )}
      </Card>

      <section aria-labelledby="tenses-heading" className="flex flex-col gap-4">
        <div>
          <h2 id="tenses-heading" className="font-display text-2xl font-semibold">
            Acerto por tempo
          </h2>
          <p className="text-muted">Últimos {overview.days} dias, somando as revisões do Anki e as respostas da trilha.</p>
        </div>
        <ul className="grid gap-4 md:grid-cols-2">
          {rows.map((row) => (
            <li key={row.tense}>
              <TenseCard row={row} />
            </li>
          ))}
        </ul>
        {!anyData && anyCards && <p className="text-muted">Você ainda não respondeu cartões desse baralho. Assim que revisar, o acerto aparece aqui.</p>}
      </section>

      <section aria-labelledby="weak-heading" className="flex flex-col gap-4">
        <div>
          <h2 id="weak-heading" className="font-display text-2xl font-semibold">
            Onde você mais erra
          </h2>
          <p className="text-muted">As frases que mais derrubaram você. Releia a resposta em voz alta.</p>
        </div>
        {overview.weakSpots.length === 0 ? (
          <Card tone="plain" className="text-muted">
            Nenhum erro registrado nos tempos verbais. Quando você errar um cartão ou um exercício, ele aparece aqui.
          </Card>
        ) : (
          <ol className="flex flex-col gap-3">
            {overview.weakSpots.map((spot, index) => (
              <li key={`${spot.source}-${index}`}>
                <WeakSpotItem spot={spot} />
              </li>
            ))}
          </ol>
        )}
      </section>

      <HowToTrain />
    </div>
  );
}

function TenseCard({ row }: { row: TenseRow }) {
  const style = TENSE_STYLE[row.tense];
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-card border-2 border-border bg-surface shadow-[0_4px_0_0_var(--color-border)]">
      <div aria-hidden className={cn("h-2 shrink-0", style.solid)} />
      <div className="flex flex-1 flex-col gap-5 p-5">
        <div className="flex items-start gap-3">
          <span aria-hidden className={cn("grid size-12 shrink-0 place-items-center rounded-2xl border-2 text-2xl", style.soft)}>
            {style.emoji}
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-2xl leading-tight font-semibold">{TENSE_NAME[row.tense]}</h3>
            <p className="text-sm text-muted">Pistas: {style.clue}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          {row.answers === 0 ? (
            <span className="font-display text-2xl leading-none font-semibold text-muted">Sem respostas ainda</span>
          ) : (
            <>
              <span className="font-display text-5xl leading-none font-semibold tabular-nums">{percentText(row.accuracy)}</span>
              <span className="text-muted">{answersText(row.answers)}</span>
            </>
          )}
          <span className={cn("rounded-pill px-3 py-1 text-sm font-bold sm:ml-auto", LEVEL_CLASS[row.level])}>{LEVEL_LABEL[row.level]}</span>
        </div>

        <div className="flex flex-col gap-3">
          <SourceBar label="Anki" tally={row.anki} barClass={style.solid} emptyText={row.cards === 0 ? "sem cartões com a tag" : "sem revisões ainda"} />
          <SourceBar label="Trilha" tally={row.trail} barClass={style.solid} emptyText="sem exercícios ainda" />
        </div>

        <div className="mt-auto rounded-2xl bg-surface-soft px-4 py-3">
          <p className="text-xs font-bold tracking-wide text-muted uppercase">Exemplo</p>
          <p lang="en" className="font-semibold">
            {style.example}
          </p>
        </div>
      </div>
    </article>
  );
}

function SourceBar({ label, tally, barClass, emptyText }: { label: string; tally: Tally; barClass: string; emptyText: string }) {
  if (tally.answers === 0) {
    return (
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="font-bold">{label}</span>
        <span className="text-right text-muted">{emptyText}</span>
      </div>
    );
  }
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="font-bold">{label}</span>
        <span className="tabular-nums text-muted">
          {tally.correct} de {tally.answers} · <span className="font-bold text-foreground">{percentText(tally.accuracy)}</span>
        </span>
      </div>
      <div role="progressbar" aria-label={`Acerto no ${label}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={tally.accuracy ?? 0} className="mt-1.5 h-3 overflow-hidden rounded-pill bg-surface-soft">
        <div className={cn("h-full rounded-pill transition-[width] duration-300", barClass)} style={{ width: `${tally.accuracy ?? 0}%` }} />
      </div>
    </div>
  );
}

function WeakSpotItem({ spot }: { spot: WeakSpot }) {
  const style = TENSE_STYLE[spot.tense];
  return (
    <div className="flex flex-col gap-2 rounded-card border-2 border-border bg-surface p-4">
      <div className="flex flex-wrap items-center gap-2 text-sm font-bold">
        <span className={cn("rounded-pill border px-3 py-0.5", style.soft)}>
          <span aria-hidden>{style.emoji}</span> {TENSE_NAME[spot.tense]}
        </span>
        <span className="rounded-pill bg-surface-soft px-3 py-0.5">{SOURCE_LABEL[spot.source]}</span>
        <span className="text-muted">{missesText(spot.misses, spot.attempts)}</span>
      </div>
      <p className="text-lg font-semibold text-pretty">{spot.prompt}</p>
      {spot.answer && (
        <p className="text-pretty">
          <span className="text-sm font-bold text-muted">Resposta: </span>
          <span lang="en" className="font-semibold">
            {spot.answer}
          </span>
        </p>
      )}
    </div>
  );
}

function HowToTrain() {
  const steps = [
    { n: 1, title: "Anki", text: "Importe o baralho “Tempos verbais”: verbos irregulares, ontem-hoje-amanhã, lacunas e tabelas de conjugação.", href: "/anki/importar", cta: "Importar baralho" },
    { n: 2, title: "Trilha", text: "Faça a unidade “Passado, presente e futuro”: conjugue o verbo e treine a escolher o tempo pela pista.", href: "/trilha", cta: "Abrir a trilha" },
    { n: 3, title: "Diário", text: "Cada dia tem um tempo em foco. Escreva e veja quais tempos você usou no texto.", href: "/diario", cta: "Escrever hoje" },
  ];
  return (
    <section aria-labelledby="train-heading" className="flex flex-col gap-4">
      <h2 id="train-heading" className="font-display text-2xl font-semibold">
        Como treinar
      </h2>
      <ol className="grid gap-4 md:grid-cols-3">
        {steps.map((step) => (
          <li key={step.n} className="flex flex-col justify-between gap-4 rounded-card border-2 border-border bg-surface p-5">
            <div>
              <p className="font-display text-xl font-semibold">
                <span className="mr-2 inline-grid size-8 place-items-center rounded-full bg-sky text-base">{step.n}</span>
                {step.title}
              </p>
              <p className="mt-2 text-pretty text-muted">{step.text}</p>
            </div>
            <ButtonLink href={step.href} variant="ghost" className="self-start">
              {step.cta}
            </ButtonLink>
          </li>
        ))}
      </ol>
    </section>
  );
}
