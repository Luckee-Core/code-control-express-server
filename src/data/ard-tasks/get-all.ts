import { getManagedSupabaseClient } from '../../db/supabase-client';
import { ARDTask } from '../../db/types';

export const getAllARDTasks = async (): Promise<ARDTask[]> => {
  const supabase = getManagedSupabaseClient();

  const { data, error } = await supabase
    .from('ard_tasks')
    .select('*')
    .order('stack_type')
    .order('sort_order');

  if (error) {
    console.error('Error fetching ARD tasks:', error);
    throw error;
  }

  return data || [];
};
