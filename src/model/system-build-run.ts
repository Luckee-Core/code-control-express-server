import type { DataModelDeliveryKind } from './data-model-delivery';

/** Lifecycle of a build run: running → completed, or paused / failed (continue) / cancelled. */
export type SystemBuildRunStatus = 'running' | 'paused' | 'failed' | 'cancelled' | 'completed';

/** Row in system_build_runs: one "Build all" of an approved data model through every delivery kind. */
export type SystemBuildRun = {
  id: string;
  software_system_id: string;
  /** data_model_proposals.id (the approved version being built). */
  proposal_id: string;
  status: SystemBuildRunStatus;
  /** Kind of the step running or waiting now; null before the first step and after the last. */
  current_kind: DataModelDeliveryKind | null;
  error: string | null;
  started_at: string;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateSystemBuildRunInput = {
  software_system_id: string;
  proposal_id: string;
};

export type UpdateSystemBuildRunInput = {
  status?: SystemBuildRunStatus;
  current_kind?: DataModelDeliveryKind | null;
  error?: string | null;
  finished_at?: string | null;
};
