/**
 * Create Task Category
 * Creates a new task category
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { TaskCategory } from './get-all';

export type CreateTaskCategoryInput = {
  name: string;
  description?: string;
  repo_type?: 'express' | 'nextjs' | 'react-native' | null;
  sort_order?: number;
  is_active?: boolean;
};

export const createTaskCategory = async (
  supabase: SupabaseClient,
  input: CreateTaskCategoryInput
): Promise<TaskCategory> => {
  const { data, error } = await supabase
    .from('task_categories')
    .insert({
      name: input.name,
      description: input.description || null,
      repo_type: input.repo_type || null,
      sort_order: input.sort_order || 0,
      is_active: input.is_active !== undefined ? input.is_active : true,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};
