import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Delete a data model generation queue item
 */
export const deleteDataModelQueueItem = async (
  supabase: SupabaseClient,
  queueItemId: string
): Promise<void> => {
  const { error } = await supabase
    .from('data_model_generation_queue')
    .delete()
    .eq('id', queueItemId);

  if (error) {
    throw new Error(`Failed to delete data model queue item: ${error.message}`);
  }
};
