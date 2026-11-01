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
        <p className="text-sm font-bold text-muted">O que fazer agora</p>
        <p className="font-display text-2xl leading-snug font-semibold text-balance">{overview.suggestion.text}</p>
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
    <div className={cn("flex h-full flex-col gap-4 rounded-card border-2 p-5", style.soft)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-2xl font-semibold">
            <span aria-hidden>{style.emoji}</span> {row.label}
          </h3>
          <p className="text-sm text-muted">Pistas: {style.clue}</p>
        </div>
        <span className={cn("shrink-0 rounded-pill px-3 py-1 text-sm font-bold", LEVEL_CLASS[row.level])}>{LEVEL_LABEL[row.level]}</span>
      </div>

      <div className="flex items-baseline gap-3">
        <span className="font-display text-5xl font-semibold tabular-nums">{percentText(row.accuracy)}</span>
        <span className="text-muted">{answersText(row.answers)}</span>
      </div>

      <div className="flex flex-col gap-3">
        <SourceBar label="Anki" tally={row.anki} barClass={style.solid} />
        <SourceBar label="Trilha" tally={row.trail} barClass={style.solid} />
      </div>

      <p lang="en" className="text-sm font-semibold">
        {style.example}
      </p>

      {row.cards === 0 && row.tense !== "perfeito" && (
        <p className="text-sm text-muted">
          Nenhum cartão com a tag <code className="rounded bg-surface px-1">tempo:{row.tense}</code> ainda.
        </p>
      )}
    </div>
  );
}

function SourceBar({ label, tally, barClass }: { label: string; tally: Tally; barClass: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm font-bold">
        <span>{label}</span>
        <span className="tabular-nums text-muted">{tally.answers === 0 ? "sem respostas" : `${tally.correct} de ${tally.answers} · ${percentText(tally.accuracy)}`}</span>
      </div>
      <div role="progressbar" aria-label={`Acerto no ${label}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={tally.accuracy ?? 0} className="mt-1 h-3 overflow-hidden rounded-pill bg-surface">
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
          <span aria-hidden>{style.emoji}</span> {spot.tense}
        </span>
        <span className="rounded-pill bg-surface-soft px-3 py-0.5">{SOURCE_LABEL[spot.source]}</span>
        <span className="text-muted">{missesText(spot.misses, spot.attempts)}</span>
      </div>
      <p className="text-lg font-semibold text-pretty">
        {spot.prompt}
      </p>
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
