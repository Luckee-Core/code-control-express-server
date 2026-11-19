import type { CrudOperation, CrudTable } from './crud-operations';
import { camelToKebab } from './crud-operations';
import { toPascalCase } from './naming';

/**
 * Web data access for one table (web_data conventions):
 * - src/api/{folder}/{operation}.ts: requestApi → ApiResult<T> through the same-origin /api/data proxy
 * - src/store/dumps/{folder}.ts: Record<id, Entity> with set / upsert / remove
 * - src/store/thunks/{folder}/*-thunk.ts: hand-written thunks returning 200 | 400 | 500
 */

const renderRequest = (crud: CrudTable, op: CrudOperation): string => {
  const { names } = crud;
  const path = `/${names.folder}`;
  const model = (types: string[]) => `import type { ${types.join(', ')} } from '@/model/${names.entity}';`;
  const head = ["import { getExpressDataUrl, requestApi } from '@/api/_shared';"];
  const byId = `\`${path}/\${encodeURIComponent(id)}\``;
  switch (op.kind) {
    case 'list':
      return [...head, model([names.Entity]), '', `/** GET /api/data${path} */`, `export const ${op.name} = () => requestApi<${names.Entity}[]>(getExpressDataUrl('${path}'));`, ''].join('\n');
    case 'list_by':
      return [
        ...head,
        model([names.Entity]),
        '',
        `/** GET /api/data${path}?${op.column}= */`,
        `export const ${op.name} = (${op.column}: string) =>`,
        `  requestApi<${names.Entity}[]>(getExpressDataUrl(\`${path}?${op.column}=\${encodeURIComponent(${op.column})}\`));`,
        '',
      ].join('\n');
    case 'get_by_id':
      return [...head, model([names.Entity]), '', `/** GET /api/data${path}/:id */`, `export const ${op.name} = (id: string) => requestApi<${names.Entity}>(getExpressDataUrl(${byId}));`, ''].join('\n');
    case 'create':
      return [
        ...head,
        model([`Create${names.Entity}Input`, names.Entity]),
        '',
        `/** POST /api/data${path} */`,
        `export const ${op.name} = (input: Create${names.Entity}Input) =>`,
        `  requestApi<${names.Entity}>(getExpressDataUrl('${path}'), { method: 'POST', body: JSON.stringify(input) });`,
        '',
      ].join('\n');
    case 'update':
      return [
        ...head,
        model([names.Entity, `Update${names.Entity}Input`]),
        '',
        `/** PATCH /api/data${path}/:id */`,
        `export const ${op.name} = (id: string, input: Update${names.Entity}Input) =>`,
        `  requestApi<${names.Entity}>(getExpressDataUrl(${byId}), { method: 'PATCH', body: JSON.stringify(input) });`,
        '',
      ].join('\n');
    case 'delete':
      return [
        ...head,
        '',
        `/** DELETE /api/data${path}/:id */`,
        `export const ${op.name} = (id: string) => requestApi<{ id: string }>(getExpressDataUrl(${byId}), { method: 'DELETE' });`,
        '',
      ].join('\n');
  }
};

const renderDump = (crud: CrudTable): string => {
  const { names } = crud;
  return [
    "import { createSlice, type PayloadAction } from '@reduxjs/toolkit';",
    `import type { ${names.Entity} } from '@/model/${names.entity}';`,
    '',
    `/** ${names.table} keyed by id. */`,
    `type ${names.Things}State = Record<string, ${names.Entity}>;`,
    '',
    `const initialState: ${names.Things}State = {};`,
    '',
    `const ${names.thingsCamel}Slice = createSlice({`,
    `  name: '${names.thingsCamel}',`,
    '  initialState,',
    '  reducers: {',
    `    set${names.Things}: (_state, action: PayloadAction<${names.Entity}[]>) =>`,
    '      Object.fromEntries(action.payload.map((row) => [row.id, row])),',
    `    upsert${names.Things}: (state, action: PayloadAction<${names.Entity}[]>) => {`,
    '      action.payload.forEach((row) => {',
    '        state[row.id] = row;',
    '      });',
    '    },',
    `    upsert${names.Entity}: (state, action: PayloadAction<${names.Entity}>) => {`,
    '      state[action.payload.id] = action.payload;',
    '    },',
    `    remove${names.Entity}: (state, action: PayloadAction<string>) => {`,
    '      delete state[action.payload];',
    '    },',
    '  },',
    '});',
    '',
    `export const ${names.Things}Actions = ${names.thingsCamel}Slice.actions;`,
    `export const ${names.thingsCamel}Reducer = ${names.thingsCamel}Slice.reducer;`,
    '',
  ].join('\n');
};

type ThunkSpec = { name: string; file: string; content: string };

const buildThunks = (crud: CrudTable): ThunkSpec[] => {
  const { names } = crud;
  const actions = `${names.Things}Actions`;
  const head = (apiName: string, types: string[] = []) => [
    "import { mapApiFailureToThunkStatus } from '@/api/_shared';",
    `import { ${apiName} } from '@/api/${names.folder}';`,
    ...(types.length > 0 ? [`import type { ${types.join(', ')} } from '@/model/${names.entity}';`] : []),
    "import type { AppThunk } from '@/store/app-thunk';",
    `import { ${actions} } from '@/store/dumps/${names.folder}';`,
    '',
  ];
  const spec = (name: string, content: string[]): ThunkSpec => ({
    name,
    file: camelToKebab(name),
    content: `${content.join('\n')}\n`,
  });
  const find = (kind: CrudOperation['kind']) => crud.operations.find((op) => op.kind === kind)!;
  const fail = '  if (!result.success || result.data === undefined) return mapApiFailureToThunkStatus(result);';

  const list = find('list');
  const thunks: ThunkSpec[] = [
    spec(`fetch${names.Things}Thunk`, [
      ...head(list.name),
      `/** Loads every ${names.entity} into the dump. */`,
      `export const fetch${names.Things}Thunk = (): AppThunk<Promise<200 | 400 | 500>> => async (dispatch) => {`,
      `  const result = await ${list.name}();`,
      fail,
      `  dispatch(${actions}.set${names.Things}(result.data));`,
      '  return 200;',
      '};',
    ]),
    spec(`fetch${names.Entity}Thunk`, [
      ...head(find('get_by_id').name),
      `/** Loads one ${names.entity} into the dump. */`,
      `export const fetch${names.Entity}Thunk =`,
      '  (id: string): AppThunk<Promise<200 | 400 | 500>> =>',
      '  async (dispatch) => {',
      `    const result = await ${find('get_by_id').name}(id);`,
      `  ${fail}`,
      `    dispatch(${actions}.upsert${names.Entity}(result.data));`,
      '    return 200;',
      '  };',
    ]),
    ...crud.operations
      .filter((op) => op.kind === 'list_by')
      .map((op) =>
        spec(`fetch${names.Things}By${toPascalCase(op.column)}Thunk`, [
          ...head(op.name),
          `/** Loads the ${names.table} for one ${op.column} into the dump. */`,
          `export const fetch${names.Things}By${toPascalCase(op.column)}Thunk =`,
          `  (${op.column}: string): AppThunk<Promise<200 | 400 | 500>> =>`,
          '  async (dispatch) => {',
          `    const result = await ${op.name}(${op.column});`,
          `  ${fail}`,
          `    dispatch(${actions}.upsert${names.Things}(result.data));`,
          '    return 200;',
          '  };',
        ]),
      ),
    spec(`create${names.Entity}Thunk`, [
      ...head(find('create').name, [`Create${names.Entity}Input`]),
      `/** Creates a ${names.entity} and adds it to the dump. */`,
      `export const create${names.Entity}Thunk =`,
      `  (input: Create${names.Entity}Input): AppThunk<Promise<200 | 400 | 500>> =>`,
      '  async (dispatch) => {',
      `    const result = await ${find('create').name}(input);`,
      `  ${fail}`,
      `    dispatch(${actions}.upsert${names.Entity}(result.data));`,
      '    return 200;',
      '  };',
    ]),
    spec(`update${names.Entity}Thunk`, [
      ...head(find('update').name, [`Update${names.Entity}Input`]),
      `/** Updates a ${names.entity} and refreshes it in the dump. */`,
      `export const update${names.Entity}Thunk =`,
      `  (id: string, input: Update${names.Entity}Input): AppThunk<Promise<200 | 400 | 500>> =>`,
      '  async (dispatch) => {',
      `    const result = await ${find('update').name}(id, input);`,
      `  ${fail}`,
      `    dispatch(${actions}.upsert${names.Entity}(result.data));`,
      '    return 200;',
      '  };',
    ]),
    spec(`delete${names.Entity}Thunk`, [
      ...head(find('delete').name),
      `/** Deletes a ${names.entity} and removes it from the dump. */`,
      `export const delete${names.Entity}Thunk =`,
      '  (id: string): AppThunk<Promise<200 | 400 | 500>> =>',
      '  async (dispatch) => {',
      `    const result = await ${find('delete').name}(id);`,
      `  ${fail}`,
      `    dispatch(${actions}.remove${names.Entity}(id));`,
      '    return 200;',
      '  };',
    ]),
  ];
  return thunks;
};

/** path → content for one table's web api folder, dump and thunks. */
export const renderWebCrud = (crud: CrudTable): Array<{ path: string; content: string }> => {
  const { folder } = crud.names;
  const thunks = buildThunks(crud);
  return [
    ...crud.operations.map((op) => ({ path: `src/api/${folder}/${op.file}.ts`, content: renderRequest(crud, op) })),
    {
      path: `src/api/${folder}/index.ts`,
      content: `${crud.operations.map((op) => `export { ${op.name} } from './${op.file}';`).join('\n')}\n`,
    },
    { path: `src/store/dumps/${folder}.ts`, content: renderDump(crud) },
    ...thunks.map((thunk) => ({ path: `src/store/thunks/${folder}/${thunk.file}.ts`, content: thunk.content })),
    {
      path: `src/store/thunks/${folder}/index.ts`,
      content: `${thunks.map((thunk) => `export { ${thunk.name} } from './${thunk.file}';`).join('\n')}\n`,
    },
  ];
};
