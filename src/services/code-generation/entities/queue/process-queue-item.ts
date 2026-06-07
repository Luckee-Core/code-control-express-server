/**
 * Process a single entity code generation queue item.
 * Calls runEntityGeneration which dynamically determines what to generate
 * based on the task definition (data_entity_generation_tasks).
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { CodeGenerationQueue } from '../../../../data/code-generation-queue';
import { updateQueueItemStatus } from '../../../../data/code-generation-queue';
import { runEntityGeneration } from '../run-entity-generation';

export type ProcessQueueItemResult = {
  success: boolean;
  error?: string;
};

export const processEntityQueueItem = async (
  supabase: SupabaseClient,
  queueItem: CodeGenerationQueue
): Promise<ProcessQueueItemResult> => {
  const now = new Date().toISOString();

  try {
    await updateQueueItemStatus(supabase, queueItem.id, {
      status: 'processing',
      started_at: now,
    });

    const result = await runEntityGeneration({
      projectId: queueItem.project_id,
      repoId: queueItem.repo_id,
      entityId: queueItem.entity_id,
      taskId: queueItem.task_id,
      selectedTaskId: queueItem.selected_task_id,
    });

    await updateQueueItemStatus(supabase, queueItem.id, {
      status: 'completed',
      completed_at: new Date().toISOString(),
      cursor_exchange_id: result.cursorExchangeId,
    });

    return { success: true };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    await updateQueueItemStatus(supabase, queueItem.id, {
      status: 'failed',
      completed_at: new Date().toISOString(),
      error_message: errorMessage,
    });

    return { success: false, error: errorMessage };
  }
};
