import type { DataModelDeliveryKind } from '../../model/data-model-delivery';
import type { CodegenRole } from '../codegen';

/** Repo roles that receive generated files, in delivery order (storage first). */
export const DELIVERY_ROLES: CodegenRole[] = ['storage', 'express', 'web'];

export const DELIVERY_KINDS: DataModelDeliveryKind[] = ['model', 'crud', 'layout', 'list', 'detail', 'dashboard', 'dispatcher'];

/**
 * The dispatcher kind puts a project behind the main gateway: the catalog seed in storage, the
 * project dispatcher and dispatcher web repos, and the registration on the shared main gateway repo.
 */
export const DISPATCHER_ROLES: CodegenRole[] = ['storage', 'dispatcher', 'dispatcher-web', 'gateway'];

/** Every role some kind delivers to (route validation). */
export const ALL_DELIVERY_ROLES: CodegenRole[] = [...DELIVERY_ROLES, 'dispatcher', 'dispatcher-web', 'gateway'];

/** Web-only kinds: the app layout, list pages, detail pages and the dashboard. */
const WEB_ONLY: ReadonlySet<DataModelDeliveryKind> = new Set(['layout', 'list', 'detail', 'dashboard']);

/** Roles each kind delivers to: model and crud go to storage, express and web, the page kinds to web only. */
export const deliveryRolesForKind = (kind: DataModelDeliveryKind): CodegenRole[] =>
  kind === 'dispatcher' ? DISPATCHER_ROLES : WEB_ONLY.has(kind) ? ['web'] : DELIVERY_ROLES;

/** Kinds that grow with the repo after merging (new tables, pages added since): a merged PR can be delivered again. */
export const isRedeliverableKind = (kind: DataModelDeliveryKind): boolean => WEB_ONLY.has(kind);

const BRANCH_SLUG: Record<DataModelDeliveryKind, string> = {
  model: 'data-model',
  crud: 'data-access',
  layout: 'app-layout',
  list: 'list-pages',
  detail: 'detail-pages',
  dashboard: 'dashboard',
  dispatcher: 'dispatcher',
};

/** Branch the PR for a data-model version is opened from. */
export const deliveryBranchName = (kind: DataModelDeliveryKind, version: number): string =>
  `code-control/${BRANCH_SLUG[kind]}-v${version}`;

/** Reads `kind` from a query string or JSON body (default model); null when invalid. */
export const readDeliveryKind = (value: unknown): DataModelDeliveryKind | null => {
  if (value === undefined || value === null || value === '') return 'model';
  return DELIVERY_KINDS.find((kind) => kind === value) ?? null;
};
