/** Row in repo_roles (seeded catalog). */
export type RepoRole = {
  key: string;
  name: string;
  description: string;
  repo_type: string;
  template_env_key: string | null;
  name_pattern: string;
  edit_order: number;
  created_at: string;
  updated_at: string;
};
