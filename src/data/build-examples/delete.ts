/**
 * Delete Build Example
 */

import { SupabaseClient } from '@supabase/supabase-js';

export const deleteBuildExample = async (
  supabase: SupabaseClient,
  id: string
): Promise<void> => {
  const { error } = await supabase
    .from('build_examples')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete build example: ${error.message}`);
  }
};
