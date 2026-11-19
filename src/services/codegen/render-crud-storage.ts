import type { CrudOperation, CrudTable } from './crud-operations';

/**
 * Storage CRUD for one table: src/data/{folder}/{operation}.ts (pool first, parameterized SQL,
 * RETURNING *, null/false when nothing matched), an index.ts barrel, and a row mapper when the
 * table has DATE columns (pg returns them as Date; the model says YYYY-MM-DD strings).
 */

const header = (doc: string): string[] => ['/**', ` * ${doc}`, ' */'];

/** A SQL string as a safe JS string literal (lifecycle filters can contain quotes). */
const sql = (text: string): string => JSON.stringify(text);

const dateColumns = (crud: CrudTable): string[] =>
  crud.columns.filter((column) => column.sql_type === 'DATE').map((column) => column.name);

const jsonColumns = (crud: CrudTable): string[] =>
  crud.columns.filter((column) => column.sql_type === 'JSONB' || column.sql_type === 'JSON').map((column) => column.name);

const mapperName = (crud: CrudTable): string => `map${crud.names.Entity}Row`;
const mapperFile = (crud: CrudTable): string => `map-${crud.names.entity}-row`;

/** `rows.map(mapX)` / `row` depending on whether the table needs a mapper. */
const mapExpr = (crud: CrudTable, value: string, many: boolean): string => {
  if (dateColumns(crud).length === 0) return value;
  return many ? `${value}.map(${mapperName(crud)})` : `${mapperName(crud)}(${value})`;
};

const imports = (crud: CrudTable, types: string[]): string[] => {
  const lines = ["import type { Pool } from 'pg';"];
  if (types.length > 0) lines.push(`import type { ${types.join(', ')} } from '../../model/${crud.names.entity}';`);
  if (dateColumns(crud).length > 0) lines.push(`import { ${mapperName(crud)} } from './${mapperFile(crud)}';`);
  return lines;
};

const where = (crud: CrudTable, condition: string): string => {
  const parts = [condition, crud.readFilter].filter(Boolean);
  return parts.length > 0 ? ` WHERE ${parts.join(' AND ')}` : '';
};

const columnsConst = (crud: CrudTable): string[] => [
  `const COLUMNS = [${crud.columns.map((column) => `'${column.name}'`).join(', ')}] as const;`,
  ...(jsonColumns(crud).length > 0
    ? [`const JSON_COLUMNS: readonly string[] = [${jsonColumns(crud).map((name) => `'${name}'`).join(', ')}];`]
    : []),
];

const toParamExpr = (crud: CrudTable): string =>
  jsonColumns(crud).length > 0
    ? '(column: string, value: unknown) => (JSON_COLUMNS.includes(column) && value !== null ? JSON.stringify(value) : value)'
    : '(_column: string, value: unknown) => value';

const renderOperation = (crud: CrudTable, op: CrudOperation): string => {
  const { names } = crud;
  const t = names.table;
  switch (op.kind) {
    case 'list':
      return [
        ...imports(crud, [names.Entity]),
        '',
        ...header(`Lists ${t} (${crud.orderBy}).`),
        `export const ${op.name} = async (pool: Pool): Promise<${names.Entity}[]> => {`,
        `  const result = await pool.query<${names.Entity}>(${sql(`SELECT * FROM ${t}${where(crud, '')} ORDER BY ${crud.orderBy}`)});`,
        `  return ${mapExpr(crud, 'result.rows', true)};`,
        '};',
        '',
      ].join('\n');
    case 'list_by':
      return [
        ...imports(crud, [names.Entity]),
        '',
        ...header(`Lists ${t} for one ${op.column}.`),
        `export const ${op.name} = async (pool: Pool, ${op.column}: string): Promise<${names.Entity}[]> => {`,
        '  const result = await pool.query<' + names.Entity + '>(',
        `    ${sql(`SELECT * FROM ${t}${where(crud, `${op.column} = $1`)} ORDER BY ${crud.orderBy}`)},`,
        `    [${op.column}],`,
        '  );',
        `  return ${mapExpr(crud, 'result.rows', true)};`,
        '};',
        '',
      ].join('\n');
    case 'get_by_id':
      return [
        ...imports(crud, [names.Entity]),
        '',
        ...header(`Returns one ${names.entity} or null.`),
        `export const ${op.name} = async (pool: Pool, id: string): Promise<${names.Entity} | null> => {`,
        `  const result = await pool.query<${names.Entity}>('SELECT * FROM ${t} WHERE id = $1', [id]);`,
        `  const row = result.rows[0];`,
        `  return row ? ${mapExpr(crud, 'row', false)} : null;`,
        '};',
        '',
      ].join('\n');
    case 'create':
      return [
        ...imports(crud, [`Create${names.Entity}Input`, names.Entity]),
        '',
        ...columnsConst(crud),
        `const toParam = ${toParamExpr(crud)};`,
        '',
        ...header(`Inserts a ${names.entity}; omitted fields use their column defaults.`),
        `export const ${op.name} = async (pool: Pool, input: Create${names.Entity}Input): Promise<${names.Entity}> => {`,
        '  const values = input as Record<string, unknown>;',
        '  const provided = COLUMNS.filter((column) => values[column] !== undefined);',
        '  const sql =',
        '    provided.length > 0',
        `      ? \`INSERT INTO ${t} (\${provided.join(', ')}) VALUES (\${provided.map((_, index) => \`$\${index + 1}\`).join(', ')}) RETURNING *\``,
        `      : ${sql(`INSERT INTO ${t} DEFAULT VALUES RETURNING *`)};`,
        `  const result = await pool.query<${names.Entity}>(sql, provided.map((column) => toParam(column, values[column])));`,
        '  const row = result.rows[0];',
        "  if (!row) throw new Error('Insert returned no row');",
        `  return ${mapExpr(crud, 'row', false)};`,
        '};',
        '',
      ].join('\n');
    case 'update':
      return [
        ...imports(crud, [names.Entity, `Update${names.Entity}Input`]),
        '',
        ...columnsConst(crud),
        `const toParam = ${toParamExpr(crud)};`,
        '',
        ...header(`Updates a ${names.entity} (only the given fields) and sets updated_at; null when not found.`),
        `export const ${op.name} = async (`,
        '  pool: Pool,',
        '  id: string,',
        `  input: Update${names.Entity}Input,`,
        `): Promise<${names.Entity} | null> => {`,
        '  const values = input as Record<string, unknown>;',
        '  const provided = COLUMNS.filter((column) => values[column] !== undefined);',
        "  const sets = ['updated_at = now()', ...provided.map((column, index) => `${column} = $${index + 2}`)];",
        `  const result = await pool.query<${names.Entity}>(`,
        `    \`UPDATE ${t} SET \${sets.join(', ')} WHERE id = $1 RETURNING *\`,`,
        '    [id, ...provided.map((column) => toParam(column, values[column]))],',
        '  );',
        '  const row = result.rows[0];',
        `  return row ? ${mapExpr(crud, 'row', false)} : null;`,
        '};',
        '',
      ].join('\n');
    case 'delete':
      return [
        "import type { Pool } from 'pg';",
        '',
        ...header(
          crud.softDelete
            ? `Soft-deletes a ${names.entity} (sets deleted_at); false when not found or already deleted.`
            : `Deletes a ${names.entity}; false when not found.`,
        ),
        `export const ${op.name} = async (pool: Pool, id: string): Promise<boolean> => {`,
        crud.softDelete
          ? `  const result = await pool.query('UPDATE ${t} SET deleted_at = now(), updated_at = now() WHERE id = $1 AND deleted_at IS NULL', [id]);`
          : `  const result = await pool.query('DELETE FROM ${t} WHERE id = $1', [id]);`,
        '  return (result.rowCount ?? 0) > 0;',
        '};',
        '',
      ].join('\n');
  }
};

const renderMapper = (crud: CrudTable): string => {
  const dates = dateColumns(crud);
  return [
    `import type { ${crud.names.Entity} } from '../../model/${crud.names.entity}';`,
    '',
    'const toDateString = (value: unknown): string | null => {',
    '  if (value === null || value === undefined) return null;',
    "  if (!(value instanceof Date)) return String(value).slice(0, 10);",
    "  const pad = (part: number): string => String(part).padStart(2, '0');",
    '  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;',
    '};',
    '',
    ...header(`Maps a ${crud.names.table} row to the model (DATE columns as YYYY-MM-DD). Not exported from the barrel.`),
    `export const ${mapperName(crud)} = (row: ${crud.names.Entity}): ${crud.names.Entity} => ({`,
    '  ...row,',
    ...dates.map((name) => `  ${name}: toDateString(row.${name}) as ${crud.names.Entity}['${name}'],`),
    '});',
    '',
  ].join('\n');
};

/** path → content for one table's storage data folder. */
export const renderStorageCrud = (crud: CrudTable): Array<{ path: string; content: string }> => {
  const base = `src/data/${crud.names.folder}`;
  const files = crud.operations.map((op) => ({ path: `${base}/${op.file}.ts`, content: renderOperation(crud, op) }));
  if (dateColumns(crud).length > 0) files.push({ path: `${base}/${mapperFile(crud)}.ts`, content: renderMapper(crud) });
  files.push({
    path: `${base}/index.ts`,
    content: `${crud.operations.map((op) => `export { ${op.name} } from './${op.file}';`).join('\n')}\n`,
  });
  return files;
};
