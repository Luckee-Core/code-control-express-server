import { getManagedSupabaseClient } from '../../db/supabase-client';
import { ARDGenerationQueue } from '../../db/types';
import { normalizeQueueProjectIds } from '../../utils/queue';

export const getAllARDGenerationQueue = async (): Promise<ARDGenerationQueue[]> => {
  const supabase = getManagedSupabaseClient();

  const { data, error } = await supabase
    .from('ard_generation_queue')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching all ARD generation queue:', error);
    throw error;
  }

  return normalizeQueueProjectIds(data || []);
};
