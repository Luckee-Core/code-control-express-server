export type RepoType = 'express' | 'python' | 'nextjs' | 'react-native';

export type SoftwareSystemRepo = {
  id: string;
  customer_id: string;
  software_system_id: string;
  repo_type: RepoType;
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
  name: string;
  repo_url: string;
  clone_url?: string | null;
};
