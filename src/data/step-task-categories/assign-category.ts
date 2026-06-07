/**
 * Assign Task Category to Build Step
 * Creates a new step-task-category mapping
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { StepTaskCategory } from './get-all';

export type AssignCategoryInput = {
  build_step_id: string;
  task_category_id: string;
};

export const assignCategory = async (
  supabase: SupabaseClient,
  input: AssignCategoryInput
): Promise<StepTaskCategory> => {
  const { data, error } = await supabase
    .from('step_task_categories')
    .insert({
      build_step_id: input.build_step_id,
      task_category_id: input.task_category_id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};
