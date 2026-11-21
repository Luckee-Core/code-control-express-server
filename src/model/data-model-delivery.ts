/** model = migrations + src/model; crud = data-access layer (CRUD, services, api, dumps, thunks). */
export type DataModelDeliveryKind = 'model' | 'crud' | 'layout';

export type DataModelDeliveryStatus = 'pending' | 'opened' | 'merged' | 'closed' | 'failed';

/** One file written by a delivery. */
export type DataModelDeliveryFile = {
  path: string;
  action: 'create' | 'update';
};

/** Row in data_model_deliveries: the PR opened for one approved proposal in one repo. */
export type DataModelDelivery = {
  id: string;
  proposal_id: string;
  software_system_id: string;
  software_system_repo_id: string;
  kind: DataModelDeliveryKind;
  role: string;
  /** owner/repo */
  repo_full_name: string;
  branch: string;
  base_branch: string;
  pr_number: number | null;
  pr_url: string;
  commit_sha: string;
  status: DataModelDeliveryStatus;
  files: DataModelDeliveryFile[];
  error: string | null;
  /** Template repo (owner/repo) and commit whose codegen templates rendered this PR. */
  template_repo: string | null;
  template_sha: string | null;
  /** After a template change merges: does re-rendering reproduce what the PR agent committed? */
  convergence: DataModelDeliveryConvergence | null;
  convergence_detail: DataModelDeliveryConvergenceDetail | null;
  convergence_checked_at: string | null;
  created_at: string;
  updated_at: string;
};

export type DataModelDeliveryConvergence = 'converged' | 'diverged';

export type DataModelDeliveryConvergenceDetail = {
  template_change_id: string;
  template_sha: string;
  /** Paths whose re-rendered content differs from the PR head. */
  differing_paths: string[];
};

export type CreateDataModelDeliveryInput = {
  proposal_id: string;
  kind: DataModelDeliveryKind;
  software_system_id: string;
  software_system_repo_id: string;
  role: string;
  repo_full_name: string;
  branch: string;
};

export type UpdateDataModelDeliveryInput = {
  branch?: string;
  base_branch?: string;
  pr_number?: number | null;
  pr_url?: string;
  commit_sha?: string;
  status?: DataModelDeliveryStatus;
  files?: DataModelDeliveryFile[];
  error?: string | null;
  template_repo?: string | null;
  template_sha?: string | null;
  convergence?: DataModelDeliveryConvergence | null;
  convergence_detail?: DataModelDeliveryConvergenceDetail | null;
  convergence_checked_at?: string | null;
};
