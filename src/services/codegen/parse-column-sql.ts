/** Pieces of a column SQL fragment such as `BOOLEAN NOT NULL DEFAULT FALSE` or `status TEXT CHECK (status IN ('a','b'))`. */
export type ParsedColumnSql = {
  sql_type: string;
  not_null: boolean;
  default_sql: string;
  enum_values: string[];
};

/**
 * Splits a type fragment (vocabulary sql_type or a lifecycle definition without its name)
 * into base type, NOT NULL, DEFAULT and CHECK-IN values.
 */
export const parseColumnSql = (fragment: string): ParsedColumnSql => {
  const text = fragment.trim();
  const typeMatch = /^([A-Z]+(?:\s+PRECISION)?(?:\[\])?)/i.exec(text);
  const sqlType = (typeMatch?.[1] ?? 'TEXT').toUpperCase();

  const notNull = /\bNOT\s+NULL\b/i.test(text);
  const defaultMatch = /\bDEFAULT\s+('(?:[^']|'')*'(?:::[a-z_\[\]]+)?|[^\s,]+(?:\(\))?)/i.exec(text);
  const checkMatch = /\bCHECK\s*\(\s*\w+\s+IN\s*\(([^)]*)\)\s*\)/i.exec(text);
  const enumValues = checkMatch
    ? Array.from(checkMatch[1].matchAll(/'((?:[^']|'')*)'/g)).map((match) => match[1].replace(/''/g, "'"))
    : [];

  return {
    sql_type: sqlType,
    not_null: notNull,
    default_sql: defaultMatch?.[1] ?? '',
    enum_values: enumValues,
  };
};

/**
 * Splits a full column definition (`deleted_at TIMESTAMPTZ`) into its name and parsed type.
 * Returns null for an empty definition (e.g. the hard_delete lifecycle).
 */
export const parseColumnDefinition = (definition: string): ({ name: string } & ParsedColumnSql) | null => {
  const text = definition.trim();
  if (!text) return null;
  const match = /^([a-z_][a-z0-9_]*)\s+(.*)$/i.exec(text);
  if (!match) return null;
  return { name: match[1].toLowerCase(), ...parseColumnSql(match[2]) };
};
