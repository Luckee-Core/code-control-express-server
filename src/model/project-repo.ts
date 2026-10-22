export type RepoType = 'express' | 'python' | 'nextjs' | 'react-native';

/** Row in customer_project_repos. */
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

export type InsertProjectRepoInput = {
  customer_id: string;
  project_id: string;
  repo_type: RepoType;
  name: string;
  repo_url: string;
  clone_url?: string | null;
};
