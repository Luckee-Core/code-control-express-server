import type { SupabaseClient } from '@supabase/supabase-js';
import type { ARDGenerationQueue } from '../../db/types';

export const getARDQueueByProject = async (
  supabase: SupabaseClient,
  projectId: string
): Promise<ARDGenerationQueue[]> => {
  const { data, error } = await supabase
    .from('ard_generation_queue')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching ARD queue by project:', error);
    throw new Error(error.message);
  }

  return data || [];
};
