import type { CodegenRole } from '../codegen';

/** Repo roles that receive data-model files, in delivery order (storage first). */
export const DELIVERY_ROLES: CodegenRole[] = ['storage', 'express', 'web'];

/** Branch the PR for a data-model version is opened from. */
export const deliveryBranchName = (version: number): string => `code-control/data-model-v${version}`;
