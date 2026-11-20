import { camelToKebab } from '../crud-operations';
import { indexName, toIdentifier, toKebabCase, toPascalCase } from '../naming';

/**
 * Generic string helpers templates can call as `it.h.*`. Naming and escaping only: what the code
 * looks like is decided by the templates.
 */
export const templateHelpers = {
  pascal: toPascalCase,
  kebab: toKebabCase,
  camel: (value: string): string => {
    const pascal = toPascalCase(value);
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
  },
  /** First letter upper-cased, rest unchanged (listThings → ListThings). */
  upperFirst: (value: string): string => value.charAt(0).toUpperCase() + value.slice(1),
  camelToKebab,
  indexName,
  identifier: toIdentifier,
  /** SQL string literal ('' escaping). */
  sqlQuote: (value: string): string => `'${value.replace(/'/g, "''")}'`,
  /** TS single-quoted string literal (\\ and \' escaping). */
  tsQuote: (value: string): string => `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`,
  /** JSON / JS double-quoted string literal. */
  json: (value: unknown): string => JSON.stringify(value),
  /** Collapses whitespace to one line. */
  oneLine: (value: string): string => value.replace(/\s+/g, ' ').trim(),
  /** One-line JSDoc text (`*` + `/` can't end the comment early); '' when empty. */
  docText: (value: string): string => value.replace(/\s+/g, ' ').replace(/\*\//g, '* /').trim(),
  /** Escapes a value for use inside a RegExp. */
  reEscape: (value: string): string => value.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'),
};

export type TemplateHelpers = typeof templateHelpers;
