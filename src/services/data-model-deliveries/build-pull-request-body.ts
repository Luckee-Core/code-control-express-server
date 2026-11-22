import type { DataModelDeliveryKind } from '../../model/data-model-delivery';
import type { DataModelProposal, DataModelProposalContent } from '../../model/data-model-proposal';
import type { CodegenRole, DispatcherPlan, RenderedFile } from '../codegen';

const ROLE_NOTE: Record<DataModelDeliveryKind, Partial<Record<CodegenRole, string>>> = {
  model: {
    storage:
      'After merging, set `DATABASE_URL` in this repo\'s `.env` and run `npm run db:apply-migrations`: on a fresh database it creates the database if needed and applies every file in `migrations/` in order. Then restart storage. (Database that already has tables: pass only the new numbers below, e.g. `npm run db:apply-migrations -- 003 004`.)',
    express: 'Model types only; invoke wrappers and services come with the API PR.',
    web: 'Model types only; src/api, dumps and thunks come with the API PR.',
  },
  crud: {
    storage: 'Each table barrel is registered in the invoke registry. Restart storage after merging to load the new operations.',
    express:
      'Routes are mounted at /api/data/{table}. Set CANONICAL_DATA_ACCESS_MODE plus STORAGE_URL + STORAGE_SECRET (direct) or MAIN_GATEWAY_URL + MAIN_GATEWAY_PROJECT_ID + DISPATCHER_GATE_SECRET (gateway) in .env.',
    web: 'The browser calls /api/data/* on the web origin; set EXPRESS_API_URL (or the gateway trio) in the web .env.',
  },
  detail: {
    storage: '',
    express: '',
    web: 'One detail page per table (join tables excluded) at /{entity}-detail-page: a summary panel with every field, an Edit modal and Delete in the actions menu, and one tab per related table. List rows now open their detail page. current{Entity} holds the open row; the detail builder holds the tab and modal state.',
  },
  list: {
    storage: '',
    express: '',
    web: 'One list page per table (join tables excluded) in the src/app/(app) route group, with search, enum and yes/no filters and sortable headers. Filters live in src/store/filters, load status in src/store/builders. Sidebar links are added for every new page.',
  },
  dashboard: {
    storage: '',
    express: '',
    web: 'The home screen at /dashboard (first sidebar link): one summary card per table (row count, active vs archived, counts per value of the first enum column) and the most recently updated rows across tables. `/` now redirects to it, unless the root page was already customized. Cards link to list pages and recent rows open detail pages where those exist.',
  },
  dispatcher: {
    storage:
      'Seeds the gate catalog (`dispatcher_exposed_endpoints`) with the storage health, meta and invoke paths. After merging, run `npm run db:apply-migrations -- <the number below>` and restart storage.',
    dispatcher:
      'Turns this repo into the project dispatcher (express template ADRs 011-014). On the studio: clone it next to the storage and API repos under the spawn root below, copy `.env.example` to `.env` (no secrets to fill: the main gateway and this dispatcher issue them at runtime), `npm install`, then let the main gateway start it on demand (it injects the secrets at spawn). Starting it by hand needs the secrets set in `.env`.',
    'dispatcher-web':
      'Turns this repo into the dispatcher web (nextjs template ADR 022): start/stop storage and the API, toggle gate paths and Try them through the main gateway. On the studio: copy `.env.example` to `.env`, `npm install`, then start it from the main gateway web UI, which injects the admin secret at runtime and passes through its own gate secret.',
    gateway:
      'Registers the project on the main gateway (registry service, gateway project, three session tables). After merging: run `npm run db:apply-migrations` and restart the main gateway. No `.env` changes: the gate and admin secrets are runtime credentials the gateway generates and injects when it spawns the project dispatcher (ADR 015).',
  },
  layout: {
    storage: '',
    express: '',
    web: 'App routes live in the src/app/(app) route group, wrapped once in AppLayout. The sidebar lists only tables whose list page exists; deliver the layout again after adding pages to link them.',
  },
};

/**
 * Markdown body for a generated pull request: tables, files and what to do after merging.
 */
export const buildPullRequestBody = (input: {
  kind: DataModelDeliveryKind;
  proposal: DataModelProposal;
  content: DataModelProposalContent;
  role: CodegenRole;
  files: RenderedFile[];
  /** Screenshot of the template's preview page (layout), shown under the summary. */
  previewImageUrl?: string | null;
  /** kind dispatcher: ids, ports, folders and secrets, listed instead of the tables. */
  dispatcher?: DispatcherPlan | null;
}): string => {
  const { kind, proposal, content, role, files, previewImageUrl, dispatcher } = input;
  const what =
    kind === 'model'
      ? 'data model'
      : kind === 'crud'
        ? 'data-access layer (standard CRUD) for data model'
        : kind === 'list'
          ? 'list pages (tables, search and filters) for data model'
          : kind === 'detail'
            ? 'detail pages (summary, edit and related tabs) for data model'
          : kind === 'dashboard'
            ? 'dashboard (table summaries and recent activity) for data model'
          : kind === 'dispatcher'
            ? `project dispatcher (${dispatcher?.project_id ?? 'project'} behind the main gateway) for data model`
          : 'app layout (sidebar, breadcrumbs and routes) for data model';
  return [
    `Generated by **Code Control**: ${what} **v${proposal.version}** (approved${proposal.approved_at ? ` ${proposal.approved_at.slice(0, 10)}` : ''}).`,
    '',
    content.summary ? `> ${content.summary.replace(/\n+/g, ' ')}` : '',
    '',
    previewImageUrl ? '### Preview' : '',
    previewImageUrl ? `![${kind === 'layout' ? 'App layout' : 'Preview'}](${previewImageUrl})` : '',
    ...(kind === 'dispatcher' && dispatcher
      ? [
          '### Dispatcher',
          `- Project id \`${dispatcher.project_id}\` (gate URL \`http://<studio>:3010/${dispatcher.project_id}/api/...\`)`,
          `- Ports: dispatcher ${dispatcher.ports.dispatcher}, storage ${dispatcher.ports.storage}, API ${dispatcher.ports.api}, dispatcher web ${dispatcher.ports.web} (all 127.0.0.1)`,
          `- Services: \`${dispatcher.service_ids.storage}\` (\`/api/storage\`), \`${dispatcher.service_ids.api}\` (\`${dispatcher.api_path_prefix}\`); main gateway \`${dispatcher.service_ids.gateway}\``,
          `- Spawn root: \`${dispatcher.spawn_root}\``,
          `- Secrets (generated at runtime, no \`.env\` values): \`${dispatcher.secrets.main_gate}\` and \`${dispatcher.secrets.main_admin}\` (gateway → dispatcher), \`${dispatcher.secrets.storage}\` (dispatcher → storage and API)`,
          `- Exposed: ${dispatcher.endpoints.map((endpoint) => `\`${endpoint.method} ${endpoint.path}\``).join(', ')}`,
        ]
      : [
          '### Tables',
          ...content.tables.map((table) => `- \`${table.name}\` (${table.archetype}, ${table.lifecycle}) — ${table.purpose}`),
        ]),
    '',
    `### Files (${files.length})`,
    ...files.map((file) => `- ${file.action === 'create' ? 'add' : 'update'} \`${file.path}\``),
    '',
    ROLE_NOTE[kind][role] ?? '',
    '',
    kind === 'dispatcher'
      ? 'Ports, folders and secret names come from the Dispatcher tab; change them there and deliver again instead of editing these files. The generic dispatcher code is copied only when missing, so fixes belong in the template.'
      : kind === 'dashboard'
      ? '`table-cards/`, `recent-activity/` and the load thunk are rewritten on every dashboard delivery, so new tables and newly added list or detail pages show up. Restyle cards in `table-summary-card/` and the page header in `src/packages/dashboard/index.tsx`; those are created only once.'
      : kind === 'detail'
      ? 'Detail pages are created only when missing, so edit them freely. Deliver again after adding tables to get their pages and tabs.'
      : kind === 'list'
      ? 'List pages are created only when missing, so edit them freely (columns, filters, copy). Rows open a detail page once one exists; the detail pages tab wires that. Deliver again after adding tables to get their pages.'
      : kind === 'layout'
      ? 'The shell components are created only when missing, so edit them freely. `src/config/routes.ts` and the sidebar links gain entries for new tables when the layout is delivered again.'
      : 'Do not hand-edit generated table files; change the data model in Code Control and deliver again. Business rules go in the `process-*.ts` files.',
  ]
    .filter((line, index, lines) => !(line === '' && lines[index - 1] === ''))
    .join('\n');
};
