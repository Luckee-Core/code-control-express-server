import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Check if any ARD generation queue item is currently processing
 */
export const hasProcessingARDQueueItem = async (
  supabase: SupabaseClient
): Promise<boolean> => {
  const { data, error } = await supabase
    .from('ard_generation_queue')
    .select('id')
    .eq('status', 'processing')
    .limit(1);

  if (error) {
    throw new Error(`Failed to check processing ARD queue items: ${error.message}`);
  }

  return (data?.length ?? 0) > 0;
};
