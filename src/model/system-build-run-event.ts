import type { DataModelDeliveryKind } from './data-model-delivery';

export type SystemBuildRunEventType =
  | 'run_started'
  | 'step_started'
  | 'step_merged'
  | 'step_skipped'
  | 'step_waiting'
  | 'step_failed'
  | 'continued'
  | 'cancelled'
  | 'run_completed'
  | 'run_failed';

/** Row in system_build_run_events: one entry in a build run's log. */
export type SystemBuildRunEvent = {
  id: string;
  run_id: string;
  step_id: string | null;
  kind: DataModelDeliveryKind | null;
  event_type: SystemBuildRunEventType;
  message: string;
  /** e.g. { pr_urls: [...] } or { repo, error }. */
  detail: Record<string, unknown> | null;
  created_at: string;
};

export type CreateSystemBuildRunEventInput = {
  run_id: string;
  step_id: string | null;
  kind: DataModelDeliveryKind | null;
  event_type: SystemBuildRunEventType;
  message: string;
  detail: Record<string, unknown> | null;
};
