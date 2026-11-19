/**
 * Shared naming for generated code: entity (singular kebab) and table (snake plural) helpers.
 */

const words = (value: string): string[] =>
  value
    .trim()
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => word.toLowerCase());

/** business-fact / business_facts → BusinessFact / BusinessFacts */
export const toPascalCase = (value: string): string =>
  words(value)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');

/** business_facts → business-facts */
export const toKebabCase = (value: string): string => words(value).join('-');

/** Postgres identifiers are limited to 63 bytes. */
export const toIdentifier = (value: string): string => value.slice(0, 63);

/** idx_{table}_{column}, truncated to a valid identifier. */
export const indexName = (table: string, column: string): string => toIdentifier(`idx_${table}_${column}`);
