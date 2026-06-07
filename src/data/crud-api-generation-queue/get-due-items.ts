import { SupabaseClient } from '@supabase/supabase-js';
import { CrudApiGenerationQueueItem } from './get-all';

/**
 * Get due CRUD API generation queue items (status = 'queued')
 * Ordered by created_at (FIFO)
 * Limited to specified count for processing
 */
export const getDueCrudApiQueueItems = async (
  supabase: SupabaseClient,
  limit: number = 1
): Promise<CrudApiGenerationQueueItem[]> => {
  const { data, error } = await supabase
    .from('crud_api_generation_queue')
    .select('*')
    .eq('status', 'queued')
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch due CRUD API queue items: ${error.message}`);
  }

  return data || [];
};
