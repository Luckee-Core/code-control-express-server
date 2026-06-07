/**
 * Insert a customer project repo (after creating from GitHub template)
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { RepoType } from './types';

export type InsertProjectRepoInput = {
  workspace_id: string;
  project_id: string;
  repo_type: RepoType;
  name: string;
  repo_url: string;
  clone_url?: string | null;
};

export const insertProjectRepo = async (
  supabase: SupabaseClient,
  input: InsertProjectRepoInput
): Promise<{ id: string }> => {
  const { data, error } = await supabase
    .from('project_repos')
    .insert({
      workspace_id: input.workspace_id,
      project_id: input.project_id,
      repo_type: input.repo_type,
      name: input.name,
      repo_url: input.repo_url,
      clone_url: input.clone_url ?? null,
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to insert customer project repo: ${error.message}`);
  }

  return { id: data.id };
};
