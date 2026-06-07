import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Delete an ARD generation queue item
 */
export const deleteARDQueueItem = async (
  supabase: SupabaseClient,
  queueItemId: string
): Promise<void> => {
  const { error } = await supabase
    .from('ard_generation_queue')
    .delete()
    .eq('id', queueItemId);

  if (error) {
    throw new Error(`Failed to delete ARD queue item: ${error.message}`);
  }
};
