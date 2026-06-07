import type { SupabaseClient } from '@supabase/supabase-js';

type UpdateStatusInput = {
  status: 'queued' | 'processing' | 'completed' | 'failed';
  started_at?: string;
  completed_at?: string;
  error_message?: string;
  cursor_exchange_id?: string;
  file_content?: string;
};

export const updateDataModelQueueStatus = async (
  supabase: SupabaseClient,
  queueItemId: string,
  updates: UpdateStatusInput
): Promise<void> => {
  const { error } = await supabase
    .from('data_model_generation_queue')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', queueItemId);

  if (error) {
    console.error('❌ Error updating queue status:', error);
    throw error;
  }

  console.log(`✅ Updated queue item ${queueItemId} to status: ${updates.status}`);
};
