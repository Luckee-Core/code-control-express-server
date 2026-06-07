/**
 * Assign Convention to Task Category
 * Creates a new convention-task-category mapping
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { ConventionTaskCategory } from './get-all';

export type AssignConventionInput = {
  convention_id: string;
  task_category_id: string;
};

export const assignConvention = async (
  supabase: SupabaseClient,
  input: AssignConventionInput
): Promise<ConventionTaskCategory> => {
  const { data, error } = await supabase
    .from('convention_task_categories')
    .insert({
      convention_id: input.convention_id,
      task_category_id: input.task_category_id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};
