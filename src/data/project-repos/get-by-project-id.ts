/**
 * Get all repos for a customer project
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { ProjectRepo } from './types';

export const getProjectReposByProjectId = async (
  supabase: SupabaseClient,
  projectId: string
): Promise<ProjectRepo[]> => {
  const { data, error } = await supabase
    .from('project_repos')
    .select('*')
    .eq('project_id', projectId)
    .order('repo_type', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch customer project repos: ${error.message}`);
  }

  return (data || []) as ProjectRepo[];
};
