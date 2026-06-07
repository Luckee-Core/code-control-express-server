/**
 * Get Build Step By ID
 * Retrieves a single build step by its ID
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { BuildStep } from './get-all';

export const getBuildStepById = async (
  supabase: SupabaseClient,
  id: string
): Promise<BuildStep | null> => {
  const { data, error } = await supabase
    .from('build_steps')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};
