const longDay = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
const fullDay = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const shortDay = new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "numeric", timeZone: "UTC" });
const monthName = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });
const asDate = (day: string) => new Date(`${day}T12:00:00Z`);
const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** "Terça-feira, 20 de outubro" */
export const formatDiaryDay = (day: string) => capitalize(longDay.format(asDate(day)));
/** "Terça-feira, 20 de outubro de 2026" */
export const formatFullDay = (day: string) => capitalize(fullDay.format(asDate(day)));
/** "ter. 20" */
export const formatWeekDay = (day: string) => shortDay.format(asDate(day)).replace(".", "");
/** "Outubro de 2026" a partir de "2026-10" */
export const formatMonthKey = (month: string) => capitalize(monthName.format(asDate(`${month}-01`)));

export const monthOf = (day: string) => day.slice(0, 7);

/** Soma (ou subtrai) meses a um `AAAA-MM`. */
export function shiftMonth(month: string, delta: number) {
  const [year, number] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, number - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** As linhas do calendário do mês (domingo a sábado); `null` nas células fora do mês. */
export function monthGrid(month: string): (string | null)[][] {
  const [year, number] = month.split("-").map(Number);
  const cells: (string | null)[] = Array.from({ length: new Date(Date.UTC(year, number - 1, 1)).getUTCDay() }, () => null);
  const daysInMonth = new Date(Date.UTC(year, number, 0)).getUTCDate();
  for (let day = 1; day <= daysInMonth; day++) cells.push(`${month}-${String(day).padStart(2, "0")}`);
  while (cells.length % 7 !== 0) cells.push(null);
  return Array.from({ length: cells.length / 7 }, (_, row) => cells.slice(row * 7, row * 7 + 7));
}

export const isDayKey = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));

export const IDEAL_WORDS = { min: 50, max: 150 } as const;

/** O que dizer sobre o tamanho do texto enquanto o aluno escreve. */
export function lengthHint(words: number) {
  if (words === 0) return "Escreva de 50 a 150 palavras. Frases simples valem!";
  if (words < 20) return "Continue: com 20 palavras o item do checklist já é marcado.";
  if (words < IDEAL_WORDS.min) return `Bom começo! Faltam ${IDEAL_WORDS.min - words} para chegar às 50 palavras.`;
  if (words <= IDEAL_WORDS.max) return "Tamanho ideal. Pode caprichar nos detalhes ou fechar por aqui.";
  return "Texto longo, ótimo! Quanto mais você escreve, mais rápido melhora.";
}

export const draftKey = (day: string) => `english-lab:diary-draft:${day}`;

/** O estado de gravação mostrado ao lado do botão. */
export function saveStatus(input: { dirty: boolean; saving: boolean; savedAt: Date | null }) {
  if (input.saving) return "Salvando…";
  if (input.dirty) return "Alterações ainda não salvas";
  if (input.savedAt) return `Salvo às ${input.savedAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
  return "";
}
