/**
 * Add ARD generation tasks to the queue.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import {
  createARDQueueItem,
  ARDGenerationQueue,
} from '../../../../data/ard-generation-queue';

export type AddARDToQueueResult = {
  success: boolean;
  queueItem?: ARDGenerationQueue;
  error?: string;
};

export const addARDToQueue = async (
  supabase: SupabaseClient,
  projectId: string,
  repoId: string,
  taskId: string
): Promise<AddARDToQueueResult> => {
  try {
    const queueItem = await createARDQueueItem(supabase, {
      project_id: projectId,
      repo_id: repoId,
      task_id: taskId,
      scheduled_at: new Date().toISOString(),
    });

    return { success: true, queueItem };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

export type AddBatchARDToQueueResult = {
  success: boolean;
  queueItems?: ARDGenerationQueue[];
  error?: string;
};

/**
 * Add multiple ARD tasks to the queue for the same repo.
 */
export const addBatchARDToQueue = async (
  supabase: SupabaseClient,
  projectId: string,
  repoId: string,
  taskIds: string[]
): Promise<AddBatchARDToQueueResult> => {
  const queueItems: ARDGenerationQueue[] = [];

  try {
    for (const taskId of taskIds) {
      const queueItem = await createARDQueueItem(supabase, {
        project_id: projectId,
        repo_id: repoId,
        task_id: taskId,
        scheduled_at: new Date().toISOString(),
      });

      queueItems.push(queueItem);
    }

    return { success: true, queueItems };
  } catch (error) {
    return {
      success: false,
      queueItems: queueItems.length > 0 ? queueItems : undefined,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
