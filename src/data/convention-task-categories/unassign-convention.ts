/**
 * Unassign Convention from Task Category
 * Deletes a convention-task-category mapping
 */

import { SupabaseClient } from '@supabase/supabase-js';

export const unassignConvention = async (
  supabase: SupabaseClient,
  conventionId: string,
  taskCategoryId: string
): Promise<void> => {
  const { error } = await supabase
    .from('convention_task_categories')
    .delete()
    .eq('convention_id', conventionId)
    .eq('task_category_id', taskCategoryId);

  if (error) throw error;
};
