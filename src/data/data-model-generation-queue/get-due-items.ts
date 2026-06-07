import type { SupabaseClient } from '@supabase/supabase-js';
import type { DataModelGenerationQueue } from './get-by-repo';

/**
 * Get due queue items with proper locking to prevent race conditions
 * Uses FOR UPDATE SKIP LOCKED to ensure only one process picks up each item
 */
export const getDueDataModelQueueItems = async (
  supabase: SupabaseClient,
  limit: number = 10
): Promise<DataModelGenerationQueue[]> => {
  // Use raw SQL with FOR UPDATE SKIP LOCKED to prevent race conditions
  // This ensures that if multiple processes run concurrently, each item is only picked up once
  const { data, error } = await supabase.rpc('get_and_lock_due_data_model_items', {
    item_limit: limit
  });

  if (error) {
    console.error('❌ Error fetching and locking due queue items:', error);
    throw error;
  }

  return data || [];
};
