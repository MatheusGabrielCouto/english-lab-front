export type DictionaryDefinition = { definition: string; example?: string };
export type DictionaryMeaning = { partOfSpeech: string; definitions: DictionaryDefinition[] };

export type LookupResult = {
  text: string;
  kind: "word" | "phrase";
  phonetic: string | null;
  meanings: DictionaryMeaning[];
  /** forma base de palavras flexionadas (went → go) */
  lemma: { word: string; phonetic?: string; meanings: DictionaryMeaning[] } | null;
  translation: {
    text: string;
    note?: string;
    /** sentido naquela frase, em inglês simples (só a Claude gera) */
    definition?: string;
    provider: "claude" | "mymemory";
  } | null;
  status: {
    dictionary: "ok" | "not_found" | "unavailable" | "skipped";
    translation: "ok" | "unavailable";
  };
};
