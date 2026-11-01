/**
 * Lowercases, hyphenates whitespace, and strips characters GitHub repo names disallow.
 */
export const slugifyRepoName = (name: string): string =>
  name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
