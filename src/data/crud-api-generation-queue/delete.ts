import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Delete a CRUD API generation queue item
 */
export const deleteCrudApiQueueItem = async (
  supabase: SupabaseClient,
  queueItemId: string
): Promise<void> => {
  const { error } = await supabase
    .from('crud_api_generation_queue')
    .delete()
    .eq('id', queueItemId);

  if (error) {
    throw new Error(`Failed to delete CRUD API queue item: ${error.message}`);
  }
};
