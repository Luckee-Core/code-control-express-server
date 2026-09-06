/**
 * ProjectRepo type (matches customer_project_repos table)
 */

export type RepoType = 'express' | 'nextjs' | 'react-native';

export type ProjectRepo = {
  id: string;
  customer_id: string;
  project_id: string;
  repo_type: RepoType;
  name: string;
  repo_url: string;
  clone_url: string | null;
  created_at: string;
  updated_at: string;
};
