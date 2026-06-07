/**
 * Get Build Example By ID
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type { BuildExample } from './get-all';

export const getBuildExampleById = async (
  supabase: SupabaseClient,
  id: string
): Promise<BuildExample | null> => {
  const { data, error } = await supabase
    .from('build_examples')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch build example: ${error.message}`);
  }

  return data as BuildExample;
};
