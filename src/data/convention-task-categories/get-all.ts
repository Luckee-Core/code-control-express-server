/**
 * Get All Convention Task Categories
 * Retrieves all convention-task-category mappings from the database
 */

import { SupabaseClient } from '@supabase/supabase-js';

export type ConventionTaskCategory = {
  id: string;
  convention_id: string;
  task_category_id: string;
  created_at: string;
};

export const getAllConventionTaskCategories = async (
  supabase: SupabaseClient
): Promise<ConventionTaskCategory[]> => {
  const { data, error } = await supabase
    .from('convention_task_categories')
    .select('*')
    .order('created_at');

  if (error) throw error;
  return data;
};
