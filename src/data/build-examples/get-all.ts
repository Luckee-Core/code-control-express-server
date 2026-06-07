/**
 * Get All Build Examples
 */

import { SupabaseClient } from '@supabase/supabase-js';

export type BuildExample = {
  id: string;
  name: string;
  tags: string[];
  language: string;
  code: string;
  created_at: string;
  updated_at: string;
};

export const getAllBuildExamples = async (
  supabase: SupabaseClient
): Promise<BuildExample[]> => {
  const { data, error } = await supabase
    .from('build_examples')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch build examples: ${error.message}`);
  }

  return data || [];
};
