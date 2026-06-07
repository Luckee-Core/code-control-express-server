import { SupabaseClient } from '@supabase/supabase-js';
import { ARDGenerationQueue } from '../../db/types';

/**
 * Get due ARD generation queue items (status = 'queued', scheduled_at <= now or null)
 * Limited to specified count for processing
 */
export const getDueARDQueueItems = async (
  supabase: SupabaseClient,
  limit: number = 1
): Promise<ARDGenerationQueue[]> => {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('ard_generation_queue')
    .select('*')
    .eq('status', 'queued')
    .or(`scheduled_at.lte.${now},scheduled_at.is.null`)
    .order('scheduled_at', { ascending: true, nullsFirst: true })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch due ARD queue items: ${error.message}`);
  }

  return data || [];
};
