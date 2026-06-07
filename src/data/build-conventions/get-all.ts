/**
 * Get All Build Conventions
 */

import { SupabaseClient } from '@supabase/supabase-js';

export type BuildConvention = {
  id: string;
  name: string;
  stack: string;
  content: string;
  tags: string[];
  created_at: string;
  updated_at: string;
};

export const getAllBuildConventions = async (
  supabase: SupabaseClient
): Promise<BuildConvention[]> => {
  const { data, error } = await supabase
    .from('build_conventions')
    .select('*')
    .order('stack', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch build conventions: ${error.message}`);
  }

  return data || [];
};
