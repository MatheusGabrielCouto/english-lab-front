/** Classes gramaticais que dicionários põem entre parênteses depois da palavra: "abandon (verb)". */
const PART_OF_SPEECH =
  "noun|verb|adjective|adverb|pronoun|preposition|conjunction|determiner|exclamation|number|" +
  "modal verb|auxiliary verb|linking verb|phrasal verb|indefinite article|definite article|" +
  "infinitive marker|article|particle|prefix|suffix|abbreviation|symbol";

const TRAILING_POS = new RegExp(`[ \\t]*\\((?:${PART_OF_SPEECH})(?:,\\s*(?:${PART_OF_SPEECH}))*\\)[ \\t]*$`, "i");
const PHONETIC_LINE = /^[ \t]*\/[^/\n]+\/[ \t]*$/;

/**
 * Tira do texto lido em voz alta o que não é para ouvir: a pronúncia entre barras
 * ("/əˈbændən/", que a voz soletraria) e a classe gramatical depois da palavra
 * ("abandon (verb)" → "abandon").
 */
export function cleanSpokenText(text: string): string {
  return text
    .split("\n")
    .filter((line) => !PHONETIC_LINE.test(line))
    .map((line) => line.replace(TRAILING_POS, ""))
    .join("\n")
    .trim();
}
