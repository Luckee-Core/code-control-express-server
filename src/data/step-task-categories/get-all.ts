/**
 * Get All Step Task Categories
 * Retrieves all step-task-category mappings from the database
 */

import { SupabaseClient } from '@supabase/supabase-js';

export type StepTaskCategory = {
  id: string;
  build_step_id: string;
  task_category_id: string;
  created_at: string;
};

export const getAllStepTaskCategories = async (
  supabase: SupabaseClient
): Promise<StepTaskCategory[]> => {
  const { data, error } = await supabase
    .from('step_task_categories')
    .select('*')
    .order('created_at');

  if (error) throw error;
  return data;
};
