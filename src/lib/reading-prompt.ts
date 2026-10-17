/**
 * Perguntas de leitura vêm no formato: Leia: “texto em inglês” Pergunta em português?
 * Separa o texto da pergunta para mostrar cada um do seu jeito.
 */
export function splitReading(prompt: string): { passage: string; question: string } | null {
  const match = /^Leia:\s*“([\s\S]+)”\s+([^”]+)$/.exec(prompt.trim());
  if (!match) return null;
  const passage = match[1].trim();
  const question = match[2].trim();
  return passage && question ? { passage, question } : null;
}
