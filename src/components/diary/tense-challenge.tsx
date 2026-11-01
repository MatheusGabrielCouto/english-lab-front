import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { focusRemaining, TENSE_STYLE } from "@/lib/tense-format";
import type { DiaryTense, TenseCounts, TenseFocus } from "@/lib/tense-types";

const THREE: DiaryTense[] = ["passado", "presente", "futuro"];
const NAME: Record<DiaryTense, string> = { passado: "Passado", presente: "Presente", futuro: "Futuro" };

/** O tempo do dia e, depois de salvar, quais dos três tempos o texto já usa. */
export function TenseChallenge({ focus, counts }: { focus: TenseFocus; counts: TenseCounts | null }) {
  const remaining = focusRemaining(focus, counts);
  const style = TENSE_STYLE[focus.tense];
  return (
    <Card tone="butter" className="p-5">
      <p className="text-sm font-bold text-muted">🕒 Desafio dos tempos verbais</p>
      <h2 className="mt-1 font-display text-2xl leading-snug font-semibold text-balance">
        <span aria-hidden>{style.emoji}</span> {focus.title}
      </h2>
      <p className="mt-1 text-pretty">{focus.task}</p>
      <ul lang="en" className="mt-2 flex flex-wrap gap-2">
        {focus.starters.map((starter) => (
          <li key={starter} className="rounded-pill bg-surface px-3 py-1 text-sm font-semibold">
            {starter}
          </li>
        ))}
      </ul>

      <ul aria-label="Tempos usados no seu texto" className="mt-4 grid grid-cols-3 gap-2">
        {THREE.map((tense) => {
          const used = counts?.[tense] ?? 0;
          return (
            <li key={tense} className={cn("rounded-2xl border-2 px-3 py-2 text-center", used > 0 ? TENSE_STYLE[tense].soft : "border-dashed border-border bg-surface")}>
              <p className="text-sm font-bold">{NAME[tense]}</p>
              <p className="font-display text-xl font-semibold tabular-nums">
                {used > 0 ? "✓ " : ""}
                {used}
              </p>
            </li>
          );
        })}
      </ul>
      <p role="status" className="mt-3 text-sm font-semibold text-pretty">
        {!counts
          ? "Salve o texto para ver quais tempos você usou."
          : remaining === 0
            ? `Meta cumprida: ${counts[focus.tense]} frases no ${NAME[focus.tense].toLowerCase()}.`
            : `Faltam ${remaining} ${remaining === 1 ? "frase" : "frases"} no ${NAME[focus.tense].toLowerCase()} para cumprir o desafio.`}
      </p>
    </Card>
  );
}
