import type { CrudOperation, CrudTable } from './crud-operations';

/**
 * API express CRUD for one table:
 * - src/data/{folder}/{operation}.ts: same-name invoke wrappers (api.data.same_name_wrapper)
 * - src/services/{folder}/: router factory, one handler per file, process functions
 *   (api.svc.*), standard routes (api.routes.standard_crud), { success, data } envelope, 200/400/404/500.
 */

const CLIENT_IMPORT = "import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';";

const signature = (crud: CrudTable, op: CrudOperation): { params: string; args: string; ret: string; types: string[] } => {
  const { Entity } = crud.names;
  switch (op.kind) {
    case 'list':
      return { params: '', args: '[]', ret: `${Entity}[]`, types: [Entity] };
    case 'list_by':
      return { params: `, ${op.column}: string`, args: `[${op.column}]`, ret: `${Entity}[]`, types: [Entity] };
    case 'get_by_id':
      return { params: ', id: string', args: '[id]', ret: `${Entity} | null`, types: [Entity] };
    case 'create':
      return { params: `, input: Create${Entity}Input`, args: '[input]', ret: Entity, types: [`Create${Entity}Input`, Entity] };
    case 'update':
      return {
        params: `, id: string, input: Update${Entity}Input`,
        args: '[id, input]',
        ret: `${Entity} | null`,
        types: [Entity, `Update${Entity}Input`],
      };
    case 'delete':
      return { params: ', id: string', args: '[id]', ret: 'boolean', types: [] };
  }
};

const renderWrapper = (crud: CrudTable, op: CrudOperation): string => {
  const sig = signature(crud, op);
  return [
    ...(sig.types.length > 0 ? [`import type { ${sig.types.join(', ')} } from '../../model/${crud.names.entity}';`] : []),
    CLIENT_IMPORT,
    '',
    '/**',
    ` * ${op.name} via storage invoke.`,
    ' */',
    `export const ${op.name} = async (client: CanonicalDataClient${sig.params}): Promise<${sig.ret}> =>`,
    `  invokeCanonicalDataOperation<${sig.ret}>(client, '${op.name}', ${sig.args});`,
    '',
  ].join('\n');
};

// ------------------------------------------------------------------- process functions
const processName = (op: CrudOperation): string => `process${op.name.charAt(0).toUpperCase()}${op.name.slice(1)}`;
const processFile = (op: CrudOperation): string => `process-${op.file}`;

const renderProcess = (crud: CrudTable, op: CrudOperation): string => {
  const sig = signature(crud, op);
  const argNames = sig.args.replace(/^\[|\]$/g, '');
  return [
    `import { ${op.name} } from '../../data/${crud.names.folder}';`,
    ...(sig.types.length > 0 ? [`import type { ${sig.types.join(', ')} } from '../../model/${crud.names.entity}';`] : []),
    "import type { CanonicalDataClient } from '../canonical-data-client';",
    '',
    '/**',
    ` * ${op.name} (business rules for ${crud.names.table} go here).`,
    ' */',
    `export const ${processName(op)} = async (client: CanonicalDataClient${sig.params}): Promise<${sig.ret}> =>`,
    `  ${op.name}(client${argNames ? `, ${argNames}` : ''});`,
    '',
  ].join('\n');
};

// ------------------------------------------------------------------- handlers
type HandlerSpec = { name: string; file: string; route: string; body: string[]; imports: string[] };

const handlerTemplate = (crud: CrudTable, spec: HandlerSpec): string =>
  [
    "import type { Request, Response } from 'express';",
    "import { getManagedCanonicalDataClient } from '../../canonical-data-client';",
    ...spec.imports,
    '',
    `/** ${spec.route} */`,
    `export const ${spec.name} = async (req: Request, res: Response): Promise<void> => {`,
    `  console.log('📥 [${crud.names.folder}.${spec.name}]', { params: req.params, query: req.query });`,
    '  try {',
    '    const client = getManagedCanonicalDataClient();',
    '    if (!client) {',
    "      res.status(500).json({ success: false, error: 'Storage client unavailable' });",
    '      return;',
    '    }',
    ...spec.body.map((line) => `    ${line}`),
    '  } catch (error) {',
    `    console.error('❌ [${crud.names.folder}.${spec.name}]', error);`,
    "    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });",
    '  }',
    '};',
    '',
  ].join('\n');

const requiredOnCreate = (crud: CrudTable): string[] =>
  crud.columns.filter((column) => column.not_null && !column.default_sql.trim()).map((column) => column.name);

const buildHandlers = (crud: CrudTable): HandlerSpec[] => {
  const { names } = crud;
  const route = `/api/data/${names.folder}`;
  const find = (kind: CrudOperation['kind']) => crud.operations.find((op) => op.kind === kind)!;
  const listBys = crud.operations.filter((op) => op.kind === 'list_by');
  const fields = `[${crud.columns.map((column) => `'${column.name}'`).join(', ')}]`;
  const pick = "import { pickFields } from '../../../utils/http/pick-fields';";
  const proc = (op: CrudOperation) => `import { ${processName(op)} } from '../${processFile(op)}';`;
  const notFound = `res.status(404).json({ success: false, error: '${names.Entity} not found' });`;
  const ok = "res.status(200).json({ success: true, data });";

  const list = find('list');
  const listBody = [
    ...listBys.flatMap((op) => [
      `const ${op.column} = typeof req.query.${op.column} === 'string' ? req.query.${op.column}.trim() : '';`,
      `if (${op.column}) {`,
      `  const data = await ${processName(op)}(client, ${op.column});`,
      `  ${ok}`,
      '  return;',
      '}',
    ]),
    `const data = await ${processName(list)}(client);`,
    ok,
  ];

  const required = requiredOnCreate(crud);
  return [
    {
      name: `get${names.Things}Handler`,
      file: `get-${names.folder}-handler`,
      route: `GET ${route}${listBys.length > 0 ? `?${listBys.map((op) => `${op.column}=`).join('&')}` : ''}`,
      imports: [proc(list), ...listBys.map(proc)],
      body: listBody,
    },
    {
      name: `get${names.Entity}ByIdHandler`,
      file: `get-${names.entity}-by-id-handler`,
      route: `GET ${route}/:id`,
      imports: [proc(find('get_by_id'))],
      body: [
        "const id = typeof req.params.id === 'string' ? req.params.id.trim() : '';",
        'if (!id) {',
        "  res.status(400).json({ success: false, error: 'id is required' });",
        '  return;',
        '}',
        `const data = await ${processName(find('get_by_id'))}(client, id);`,
        'if (!data) {',
        `  ${notFound}`,
        '  return;',
        '}',
        ok,
      ],
    },
    {
      name: `post${names.Entity}Handler`,
      file: `post-${names.entity}-handler`,
      route: `POST ${route}`,
      imports: [pick, proc(find('create'))],
      body: [
        `const input = pickFields(req.body, ${fields});`,
        ...(required.length > 0
          ? [
              `const missing = [${required.map((name) => `'${name}'`).join(', ')}].filter((field) => input[field] === undefined || input[field] === null);`,
              'if (missing.length > 0) {',
              "  res.status(400).json({ success: false, error: `Missing required fields: ${missing.join(', ')}` });",
              '  return;',
              '}',
            ]
          : []),
        `const data = await ${processName(find('create'))}(client, input as Parameters<typeof ${processName(find('create'))}>[1]);`,
        ok,
      ],
    },
    {
      name: `patch${names.Entity}Handler`,
      file: `patch-${names.entity}-handler`,
      route: `PATCH ${route}/:id`,
      imports: [pick, proc(find('update'))],
      body: [
        "const id = typeof req.params.id === 'string' ? req.params.id.trim() : '';",
        `const input = pickFields(req.body, ${fields});`,
        'if (!id || Object.keys(input).length === 0) {',
        "  res.status(400).json({ success: false, error: 'id and at least one field are required' });",
        '  return;',
        '}',
        `const data = await ${processName(find('update'))}(client, id, input as Parameters<typeof ${processName(find('update'))}>[2]);`,
        'if (!data) {',
        `  ${notFound}`,
        '  return;',
        '}',
        ok,
      ],
    },
    {
      name: `delete${names.Entity}Handler`,
      file: `delete-${names.entity}-handler`,
      route: `DELETE ${route}/:id`,
      imports: [proc(find('delete'))],
      body: [
        "const id = typeof req.params.id === 'string' ? req.params.id.trim() : '';",
        'if (!id) {',
        "  res.status(400).json({ success: false, error: 'id is required' });",
        '  return;',
        '}',
        `const deleted = await ${processName(find('delete'))}(client, id);`,
        'if (!deleted) {',
        `  ${notFound}`,
        '  return;',
        '}',
        "res.status(200).json({ success: true, data: { id } });",
      ],
    },
  ];
};

const renderRouter = (crud: CrudTable, handlers: HandlerSpec[]): string => {
  const [list, byId, post, patch, del] = handlers;
  return [
    "import { Router } from 'express';",
    "import * as handlers from './routes';",
    '',
    '/**',
    ` * ${crud.names.table} CRUD router for /api/data/${crud.names.folder}.`,
    ' */',
    `export const create${crud.names.Things}Router = (): Router => {`,
    '  const router = Router();',
    `  router.get('/', handlers.${list.name});`,
    `  router.get('/:id', handlers.${byId.name});`,
    `  router.post('/', handlers.${post.name});`,
    `  router.patch('/:id', handlers.${patch.name});`,
    `  router.delete('/:id', handlers.${del.name});`,
    '  return router;',
    '};',
    '',
  ].join('\n');
};

/** path → content for one table's express data wrappers and service folder. */
export const renderExpressCrud = (crud: CrudTable): Array<{ path: string; content: string }> => {
  const { folder } = crud.names;
  const handlers = buildHandlers(crud);
  return [
    ...crud.operations.map((op) => ({ path: `src/data/${folder}/${op.file}.ts`, content: renderWrapper(crud, op) })),
    {
      path: `src/data/${folder}/index.ts`,
      content: `${crud.operations.map((op) => `export { ${op.name} } from './${op.file}';`).join('\n')}\n`,
    },
    ...crud.operations.map((op) => ({ path: `src/services/${folder}/${processFile(op)}.ts`, content: renderProcess(crud, op) })),
    ...handlers.map((spec) => ({ path: `src/services/${folder}/routes/${spec.file}.ts`, content: handlerTemplate(crud, spec) })),
    {
      path: `src/services/${folder}/routes/index.ts`,
      content: `${handlers.map((spec) => `export { ${spec.name} } from './${spec.file}';`).join('\n')}\n`,
    },
    { path: `src/services/${folder}/router.ts`, content: renderRouter(crud, handlers) },
    { path: `src/services/${folder}/index.ts`, content: `export { create${crud.names.Things}Router } from './router';\n` },
  ];
};
