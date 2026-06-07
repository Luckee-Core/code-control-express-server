import type { SupabaseClient } from '@supabase/supabase-js';
import type { ARDGenerationQueue } from '../../db/types';
import {
  CUSTOMER_QUEUE_PROJECT_ID_COLUMN,
  normalizeQueueProjectIds,
} from '../../utils/queue';

export const getARDQueueByProject = async (
  supabase: SupabaseClient,
  projectId: string
): Promise<ARDGenerationQueue[]> => {
  const { data, error } = await supabase
    .from('ard_generation_queue')
    .select('*')
    .eq(CUSTOMER_QUEUE_PROJECT_ID_COLUMN, projectId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching ARD queue by project:', error);
    throw new Error(error.message);
  }

  return normalizeQueueProjectIds(data || []);
};
