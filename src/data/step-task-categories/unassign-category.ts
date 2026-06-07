/**
 * Unassign Task Category from Build Step
 * Deletes a step-task-category mapping
 */

import { SupabaseClient } from '@supabase/supabase-js';

export const unassignCategory = async (
  supabase: SupabaseClient,
  buildStepId: string,
  taskCategoryId: string
): Promise<void> => {
  const { error } = await supabase
    .from('step_task_categories')
    .delete()
    .eq('build_step_id', buildStepId)
    .eq('task_category_id', taskCategoryId);

  if (error) throw error;
};
