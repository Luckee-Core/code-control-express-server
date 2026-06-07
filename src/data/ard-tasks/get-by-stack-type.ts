import { getManagedSupabaseClient } from '../../db/supabase-client';
import { ARDTask } from '../../db/types';

export const getARDTasksByStackType = async (
  stackType: 'express' | 'nextjs' | 'react-native'
): Promise<ARDTask[]> => {
  const supabase = getManagedSupabaseClient();

  const { data, error } = await supabase
    .from('ard_tasks')
    .select('*')
    .eq('stack_type', stackType)
    .order('sort_order');

  if (error) {
    console.error(`Error fetching ARD tasks for ${stackType}:`, error);
    throw error;
  }

  return data || [];
};
