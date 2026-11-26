import type { DataModelDeliveryKind } from './data-model-delivery';

/** pending → running → merged; waiting_merge when a PR stayed open; skipped when the kind does not apply. */
export type SystemBuildRunStepStatus = 'pending' | 'running' | 'waiting_merge' | 'merged' | 'skipped' | 'failed';

/** Row in system_build_run_steps: one delivery kind (tab) within a build run. */
export type SystemBuildRunStep = {
  id: string;
  run_id: string;
  kind: DataModelDeliveryKind;
  position: number;
  status: SystemBuildRunStepStatus;
  /** data_model_deliveries.id of each repo this step delivered to. */
  delivery_ids: string[];
  /** Why the step was skipped or is waiting. */
  note: string | null;
  error: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateSystemBuildRunStepInput = {
  run_id: string;
  kind: DataModelDeliveryKind;
  position: number;
  status: SystemBuildRunStepStatus;
  note: string | null;
};

export type UpdateSystemBuildRunStepInput = {
  status?: SystemBuildRunStepStatus;
  delivery_ids?: string[];
  note?: string | null;
  error?: string | null;
  started_at?: string | null;
  finished_at?: string | null;
};
