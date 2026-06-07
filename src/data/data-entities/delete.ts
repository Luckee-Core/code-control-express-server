/**
 * Delete Data Entity
 */

import { SupabaseClient } from '@supabase/supabase-js';

export const deleteDataEntity = async (
  supabase: SupabaseClient,
  id: string
): Promise<void> => {
  const { error } = await supabase
    .from('data_entity')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete data entity: ${error.message}`);
  }
};
