/**
 * Delete Task Category
 * Deletes a task category by ID
 */

import { SupabaseClient } from '@supabase/supabase-js';

export const deleteTaskCategory = async (
  supabase: SupabaseClient,
  id: string
): Promise<void> => {
  const { error } = await supabase
    .from('task_categories')
    .delete()
    .eq('id', id);

  if (error) throw error;
};
