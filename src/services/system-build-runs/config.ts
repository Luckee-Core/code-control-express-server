import type { DataModelDeliveryKind } from '../../model/data-model-delivery';

/** The tabs a build run delivers, in order: each kind needs the PRs of the ones before it merged. */
export const BUILD_STEPS: Array<{ kind: DataModelDeliveryKind; tab: string }> = [
  { kind: 'model', tab: 'Data model' },
  { kind: 'crud', tab: 'API' },
  { kind: 'layout', tab: 'Layout' },
  { kind: 'list', tab: 'Tables' },
  { kind: 'detail', tab: 'Detail pages' },
  { kind: 'dashboard', tab: 'Dashboard' },
  { kind: 'dispatcher', tab: 'Dispatcher' },
];

/** Tab label of a delivery kind, for messages. */
export const tabLabel = (kind: DataModelDeliveryKind): string => BUILD_STEPS.find((step) => step.kind === kind)?.tab ?? kind;

/** A run still `running` this long after its last update, with no live job here, was interrupted. */
export const STALE_RUNNING_MS = 30 * 60 * 1000;
