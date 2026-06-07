/**
 * Get Build Convention By ID
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type { BuildConvention } from './get-all';

export const getBuildConventionById = async (
  supabase: SupabaseClient,
  id: string
): Promise<BuildConvention | null> => {
  const { data, error } = await supabase
    .from('build_conventions')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch build convention: ${error.message}`);
  }

  return data as BuildConvention;
};
