/**
 * A fila de exercícios de uma lição. O que o aluno erra volta para o fim da fila
 * e só sai quando acerta (a nota considera só a primeira resposta, no servidor).
 */
export type Flow = {
  /** chaves ainda por fazer; a primeira é a atual */
  queue: string[];
  /** chaves já acertadas (na 1ª ou numa repetição) */
  done: string[];
  total: number;
  /** quantas vezes cada exercício já foi mostrado (para variar o embaralhamento) */
  rounds: Record<string, number>;
};

export function startFlow(keys: string[]): Flow {
  return { queue: [...keys], done: [], total: keys.length, rounds: Object.fromEntries(keys.map((key) => [key, 0])) };
}

export const currentKey = (flow: Flow) => flow.queue[0] ?? null;
export const isFinished = (flow: Flow) => flow.queue.length === 0;

/** 0 a 100 */
export const progressOf = (flow: Flow) => (flow.total === 0 ? 100 : Math.round((flow.done.length / flow.total) * 100));

/** O aluno viu a correção e apertou "Continuar". */
export function advance(flow: Flow, correct: boolean): Flow {
  const [key, ...rest] = flow.queue;
  if (key === undefined) return flow;
  if (correct) return { ...flow, queue: rest, done: [...flow.done, key] };
  return { ...flow, queue: [...rest, key], rounds: { ...flow.rounds, [key]: (flow.rounds[key] ?? 0) + 1 } };
}
