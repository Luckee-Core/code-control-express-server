import type { DataModelDeliveryKind } from '../../model/data-model-delivery';
import type { CodegenRole } from '../codegen';

/** Repo roles that receive generated files, in delivery order (storage first). */
export const DELIVERY_ROLES: CodegenRole[] = ['storage', 'express', 'web'];

export const DELIVERY_KINDS: DataModelDeliveryKind[] = ['model', 'crud', 'layout', 'list'];

/** Roles each kind delivers to: the app layout and the list pages are web only. */
export const deliveryRolesForKind = (kind: DataModelDeliveryKind): CodegenRole[] =>
  kind === 'layout' || kind === 'list' ? ['web'] : DELIVERY_ROLES;

/** Kinds that grow with the repo after merging (new tables, pages added since): a merged PR can be delivered again. */
export const isRedeliverableKind = (kind: DataModelDeliveryKind): boolean => kind === 'layout' || kind === 'list';

const BRANCH_SLUG: Record<DataModelDeliveryKind, string> = {
  model: 'data-model',
  crud: 'data-access',
  layout: 'app-layout',
  list: 'list-pages',
};

/** Branch the PR for a data-model version is opened from. */
export const deliveryBranchName = (kind: DataModelDeliveryKind, version: number): string =>
  `code-control/${BRANCH_SLUG[kind]}-v${version}`;

/** Reads `kind` from a query string or JSON body (default model); null when invalid. */
export const readDeliveryKind = (value: unknown): DataModelDeliveryKind | null => {
  if (value === undefined || value === null || value === '') return 'model';
  return DELIVERY_KINDS.find((kind) => kind === value) ?? null;
};
