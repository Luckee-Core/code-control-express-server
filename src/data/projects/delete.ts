/**
 * Delete Customer Project
 */

import { SupabaseClient } from '@supabase/supabase-js';

export const deleteProject = async (
  supabase: SupabaseClient,
  id: string
): Promise<void> => {
  const { error } = await supabase
    .from('customer_projects')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete customer project: ${error.message}`);
  }
};
