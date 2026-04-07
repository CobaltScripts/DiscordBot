declare module 'homoglyph-search' {
  export interface HomoglyphMatch {
    match: string;
    word: string;
    index: number;
  }

  export interface HomoglyphSearch {
    search(inputText: string, targetWords: string[]): HomoglyphMatch[];
    buildSearchFunction(charMap: Record<string, string[]>): HomoglyphSearch['search'];
  }

  const homoglyphSearch: HomoglyphSearch;

  export = homoglyphSearch;
}
