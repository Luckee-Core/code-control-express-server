import { SupabaseClient } from '@supabase/supabase-js';
import { ARDGenerationQueue } from '../../db/types';

/**
 * Get all ARD generation queue items for a repo
 */
export const getARDQueueByRepo = async (
  supabase: SupabaseClient,
  repoId: string
): Promise<ARDGenerationQueue[]> => {
  const { data, error } = await supabase
    .from('ard_generation_queue')
    .select('*')
    .eq('repo_id', repoId)
    .order('scheduled_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch ARD queue items: ${error.message}`);
  }

  return data || [];
};
