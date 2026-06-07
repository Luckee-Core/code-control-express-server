import { SupabaseClient } from '@supabase/supabase-js';
import { CrudApiGenerationQueueItem } from './get-all';

export type UpdateCrudApiQueueStatusInput = Partial<{
  status: 'queued' | 'processing' | 'completed' | 'failed';
  pr_link: string;
  error: string;
}>;

/**
 * Update CRUD API generation queue item status
 */
export const updateCrudApiQueueStatus = async (
  supabase: SupabaseClient,
  queueItemId: string,
  updates: UpdateCrudApiQueueStatusInput
): Promise<CrudApiGenerationQueueItem> => {
  const { data, error } = await supabase
    .from('crud_api_generation_queue')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', queueItemId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update CRUD API queue status: ${error.message}`);
  }

  return data;
};
