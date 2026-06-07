/**
 * Delete Build Convention
 */

import { SupabaseClient } from '@supabase/supabase-js';

export const deleteBuildConvention = async (
  supabase: SupabaseClient,
  id: string
): Promise<void> => {
  const { error } = await supabase
    .from('build_conventions')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete build convention: ${error.message}`);
  }
};
