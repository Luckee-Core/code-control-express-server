/**
 * Get Task Category By ID
 * Retrieves a single task category by its ID
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { TaskCategory } from './get-all';

export const getTaskCategoryById = async (
  supabase: SupabaseClient,
  id: string
): Promise<TaskCategory | null> => {
  const { data, error } = await supabase
    .from('task_categories')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};
