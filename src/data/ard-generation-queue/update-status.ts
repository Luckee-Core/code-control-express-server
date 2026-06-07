import { SupabaseClient } from '@supabase/supabase-js';
import { ARDGenerationQueue } from '../../db/types';

export type UpdateARDQueueStatusInput = Partial<{
  status: 'queued' | 'processing' | 'completed' | 'failed';
  started_at: string;
  completed_at: string;
  error_message: string;
  cursor_exchange_id: string;
}>;

/**
 * Update ARD generation queue item status
 */
export const updateARDQueueStatus = async (
  supabase: SupabaseClient,
  queueItemId: string,
  updates: UpdateARDQueueStatusInput
): Promise<ARDGenerationQueue> => {
  const { data, error } = await supabase
    .from('ard_generation_queue')
    .update(updates)
    .eq('id', queueItemId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update ARD queue status: ${error.message}`);
  }

  return data;
};
