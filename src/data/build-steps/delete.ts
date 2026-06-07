/**
 * Delete Build Step
 * Deletes a build step by ID
 */

import { SupabaseClient } from '@supabase/supabase-js';

export const deleteBuildStep = async (
  supabase: SupabaseClient,
  id: string
): Promise<void> => {
  const { error } = await supabase
    .from('build_steps')
    .delete()
    .eq('id', id);

  if (error) throw error;
};
