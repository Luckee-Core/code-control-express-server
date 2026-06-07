/**
 * Create Code Generation Queue Item
 * Adds a single code generation task to the queue
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { CodeGenerationQueue } from './types';

export type CreateCodeGenerationQueueItemInput = {
  project_id: string;
  repo_id: string;
  entity_id: string;
  task_id: string;
  selected_task_id: string;
  scheduled_at?: string;
};

export const createQueueItem = async (
  supabase: SupabaseClient,
  input: CreateCodeGenerationQueueItemInput
): Promise<CodeGenerationQueue> => {
  const scheduledAt = input.scheduled_at ?? new Date().toISOString();

  const { data, error } = await supabase
    .from('code_generation_queue')
    .insert({
      project_id: input.project_id,
      repo_id: input.repo_id,
      entity_id: input.entity_id,
      task_id: input.task_id,
      selected_task_id: input.selected_task_id,
      status: 'queued',
      scheduled_at: scheduledAt,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create queue item: ${error.message}`);
  }

  return data;
};
