import type { DataModelDeliveryKind } from '../../model/data-model-delivery';
import type { CodegenRole } from '../codegen';

/** Repo roles that receive generated files, in delivery order (storage first). */
export const DELIVERY_ROLES: CodegenRole[] = ['storage', 'express', 'web'];

export const DELIVERY_KINDS: DataModelDeliveryKind[] = ['model', 'crud'];

/** Branch the PR for a data-model version is opened from. */
export const deliveryBranchName = (kind: DataModelDeliveryKind, version: number): string =>
  kind === 'model' ? `code-control/data-model-v${version}` : `code-control/data-access-v${version}`;

/** Reads `kind` from a query string or JSON body (default model); null when invalid. */
export const readDeliveryKind = (value: unknown): DataModelDeliveryKind | null => {
  if (value === undefined || value === null || value === '') return 'model';
  return DELIVERY_KINDS.find((kind) => kind === value) ?? null;
};
