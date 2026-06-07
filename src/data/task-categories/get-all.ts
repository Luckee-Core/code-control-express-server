/**
 * Get All Task Categories
 * Retrieves all task categories from the database
 */

import { SupabaseClient } from '@supabase/supabase-js';

export type TaskCategory = {
  id: string;
  name: string;
  description: string | null;
  repo_type: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export const getAllTaskCategories = async (
  supabase: SupabaseClient
): Promise<TaskCategory[]> => {
  const { data, error } = await supabase
    .from('task_categories')
    .select('*')
    .order('repo_type, sort_order');

  if (error) throw error;
  return data;
};
