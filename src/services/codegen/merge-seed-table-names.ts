/**
 * Appends tables (already in FK order) to the SEED_TABLE_NAMES array in
 * src/services/storage/seed-table-names.ts. Returns null when the array is missing or
 * every table is already listed.
 */
export const mergeSeedTableNames = (existing: string, tables: string[]): string | null => {
  const match = /(SEED_TABLE_NAMES\s*=\s*\[)([\s\S]*?)(\]\s*as\s+const)/.exec(existing);
  if (!match) return null;

  const listed = new Set(Array.from(match[2].matchAll(/'([^']+)'|"([^"]+)"/g)).map((item) => item[1] ?? item[2]));
  const missing = tables.filter((table) => !listed.has(table));
  if (missing.length === 0) return null;

  const items = [...listed, ...missing].map((table) => `  '${table}',`).join('\n');
  const replacement = `${match[1]}\n${items}\n${match[3]}`;
  return existing.slice(0, match.index) + replacement + existing.slice(match.index + match[0].length);
};
