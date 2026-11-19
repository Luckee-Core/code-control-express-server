/** Row in setup_presets (project type) with the repo roles it creates, in order. */
export type SetupPreset = {
  key: string;
  name: string;
  description: string;
  is_active: boolean;
  sort_order: number;
  /** repo_roles keys from setup_preset_roles, in sort order ([] for None). */
  role_keys: string[];
  created_at: string;
  updated_at: string;
};

/** What happened to one role's repo when a preset was applied. */
export type SetupPresetRepoResult = {
  role: string;
  role_name: string;
  status: 'created' | 'already_done' | 'template_missing' | 'failed';
  repo_name: string | null;
  repo_url: string | null;
  error: string | null;
};
