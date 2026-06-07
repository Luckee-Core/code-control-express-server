/**
 * Get All Build Steps
 * Retrieves all build steps from the database
 */

import { SupabaseClient } from '@supabase/supabase-js';

export type BuildStep = {
  id: string;
  name: string;
  description: string | null;
  repo_type: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export const getAllBuildSteps = async (
  supabase: SupabaseClient
): Promise<BuildStep[]> => {
  const { data, error } = await supabase
    .from('build_steps')
    .select('*')
    .order('repo_type, sort_order');

  if (error) throw error;
  return data;
};
