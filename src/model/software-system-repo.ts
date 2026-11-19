/** GitHub template family the repo was created from (repo_roles.repo_type). */
export type RepoType = 'express' | 'python' | 'nextjs' | 'react-native' | 'storage-express';

/** Row in software_system_repos. */
export type SoftwareSystemRepo = {
  id: string;
  customer_id: string;
  software_system_id: string;
  repo_type: RepoType;
  /** repo_roles.key (storage, express, web, dispatcher, …); null until assigned. */
  role: string | null;
  name: string;
  repo_url: string;
  clone_url: string | null;
  created_at: string;
  updated_at: string;
};

export type InsertSoftwareSystemRepoInput = {
  customer_id: string;
  software_system_id: string;
  repo_type: RepoType;
  role?: string | null;
  name: string;
  repo_url: string;
  clone_url?: string | null;
};
