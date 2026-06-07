import { SupabaseClient } from '@supabase/supabase-js';
import { ARDGenerationQueue } from '../../db/types';
import { normalizeQueueProjectId, queueProjectIdInsertFields } from '../../utils/queue';

export type CreateARDQueueItemInput = {
  project_id: string;
  repo_id: string;
  task_id: string;
  scheduled_at?: string;
};

/**
 * Create an ARD generation queue item
 */
export const createARDQueueItem = async (
  supabase: SupabaseClient,
  input: CreateARDQueueItemInput
): Promise<ARDGenerationQueue> => {
  const { data, error } = await supabase
    .from('ard_generation_queue')
    .insert({
      ...queueProjectIdInsertFields(input.project_id),
      repo_id: input.repo_id,
      task_id: input.task_id,
      scheduled_at: input.scheduled_at || new Date().toISOString(),
      status: 'queued',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create ARD queue item: ${error.message}`);
  }

  return normalizeQueueProjectId(data);
};
