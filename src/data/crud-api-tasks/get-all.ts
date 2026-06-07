/**
 * Get All CRUD API Tasks
 * Retrieves all CRUD API task templates
 */

import { SupabaseClient } from '@supabase/supabase-js';

export type CrudApiTask = {
  id: string;
  name: string;
  task_type: string;
  description: string | null;
  prompt_template: string;
  output_path_template: string;
  operation_key: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export const getAllCrudApiTasks = async (
  supabase: SupabaseClient
): Promise<CrudApiTask[]> => {
  const { data, error } = await supabase
    .from('crud_api_tasks')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch CRUD API tasks: ${error.message}`);
  }

  return data || [];
};
