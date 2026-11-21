/**
 * Reduces source text to its tokens so the convergence check ignores layout: whitespace, line
 * wrapping and trailing commas (e.g. a long import that a formatter split across lines).
 */
export const normalizeCodeLayout = (text: string): string =>
  text
    .replace(/,(\s*[}\])])/g, '$1')
    .replace(/\s+/g, ' ')
    .replace(/ ?([{}()[\],;:<>=]) ?/g, '$1')
    .trim();
