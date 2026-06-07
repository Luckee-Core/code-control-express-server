/**
 * Get Due Code Generation Queue Items
 * Retrieves items that are ready for processing (status = 'queued' and scheduled_at <= NOW())
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { CodeGenerationQueue } from './types';

export const getDueQueueItems = async (
  supabase: SupabaseClient,
  limit: number = 5
): Promise<CodeGenerationQueue[]> => {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('code_generation_queue')
    .select('*')
    .eq('status', 'queued')
    .lte('scheduled_at', now)
    .order('scheduled_at', { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch due queue items: ${error.message}`);
  }

  return data || [];
};
