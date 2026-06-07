/**
 * Delete Data Entity Field
 */

import { SupabaseClient } from '@supabase/supabase-js';

export const deleteDataEntityField = async (
  supabase: SupabaseClient,
  id: string
): Promise<void> => {
  const { error } = await supabase
    .from('data_entity_field')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete data entity field: ${error.message}`);
  }
};
