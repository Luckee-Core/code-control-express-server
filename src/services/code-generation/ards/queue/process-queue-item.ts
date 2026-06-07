/**
 * Process a single ARD generation queue item.
 * Calls runARDGeneration which dynamically determines what to generate
 * based on the task definition (data_entity_generation_tasks).
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { ARDGenerationQueue } from '../../../../data/ard-generation-queue';
import { updateARDQueueStatus } from '../../../../data/ard-generation-queue';
import { runARDGeneration } from '../run-ard-generation';

export type ProcessARDQueueItemResult = {
  success: boolean;
  error?: string;
};

export const processARDQueueItem = async (
  supabase: SupabaseClient,
  queueItem: ARDGenerationQueue
): Promise<ProcessARDQueueItemResult> => {
  const now = new Date().toISOString();

  try {
    await updateARDQueueStatus(supabase, queueItem.id, {
      status: 'processing',
      started_at: now,
    });

    const result = await runARDGeneration({
      projectId: queueItem.project_id,
      repoId: queueItem.repo_id,
      taskId: queueItem.task_id,
    });

    await updateARDQueueStatus(supabase, queueItem.id, {
      status: 'completed',
      completed_at: new Date().toISOString(),
      cursor_exchange_id: result.cursorExchangeId,
    });

    return { success: true };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    await updateARDQueueStatus(supabase, queueItem.id, {
      status: 'failed',
      completed_at: new Date().toISOString(),
      error_message: errorMessage,
    });

    return { success: false, error: errorMessage };
  }
};
