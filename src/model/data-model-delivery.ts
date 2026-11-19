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
  created_at: string;
  updated_at: string;
};

export type CreateDataModelDeliveryInput = {
  proposal_id: string;
  software_system_id: string;
  software_system_repo_id: string;
  role: string;
  repo_full_name: string;
  branch: string;
};

export type UpdateDataModelDeliveryInput = {
  base_branch?: string;
  pr_number?: number | null;
  pr_url?: string;
  commit_sha?: string;
  status?: DataModelDeliveryStatus;
  files?: DataModelDeliveryFile[];
  error?: string | null;
};
