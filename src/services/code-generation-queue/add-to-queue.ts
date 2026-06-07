/**
 * Add code generation tasks to the queue.
 * For batch: ensures each entity has the task selected, then creates queue items.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { createDataEntitySelectedTask } from '../../data/data-entity-selected-tasks/create';
import { getDataEntitySelectedTasksByEntity } from '../../data/data-entity-selected-tasks/get-by-entity';
import {
  createQueueItem,
  CodeGenerationQueue,
} from '../../data/code-generation-queue';

export type AddToQueueResult = {
  success: boolean;
  queueItem?: CodeGenerationQueue;
  error?: string;
};

export const addToQueue = async (
  supabase: SupabaseClient,
  projectId: string,
  repoId: string,
  entityId: string,
  taskId: string,
  selectedTaskId: string
): Promise<AddToQueueResult> => {
  try {
    const queueItem = await createQueueItem(supabase, {
      project_id: projectId,
      repo_id: repoId,
      entity_id: entityId,
      task_id: taskId,
      selected_task_id: selectedTaskId,
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

export type AddBatchToQueueResult = {
  success: boolean;
  queueItems?: CodeGenerationQueue[];
  error?: string;
};

/**
 * Add multiple entities to the queue for the same task.
 * Ensures each entity has the task selected (creates selected_task if needed).
 */
export const addBatchToQueue = async (
  supabase: SupabaseClient,
  projectId: string,
  repoId: string,
  entityIds: string[],
  taskId: string
): Promise<AddBatchToQueueResult> => {
  const queueItems: CodeGenerationQueue[] = [];

  try {
    for (const entityId of entityIds) {
      let selectedTasks = await getDataEntitySelectedTasksByEntity(entityId);
      let selectedTask = selectedTasks.find((t) => t.task_id === taskId);

      if (!selectedTask) {
        try {
          selectedTask = await createDataEntitySelectedTask({
            entity_id: entityId,
            task_id: taskId,
          });
        } catch (createError) {
          const msg =
            createError instanceof Error ? createError.message : '';
          if (msg.includes('duplicate') || msg.includes('unique')) {
            selectedTasks = await getDataEntitySelectedTasksByEntity(entityId);
            selectedTask = selectedTasks.find((t) => t.task_id === taskId);
          }
          if (!selectedTask) {
            console.error(
              `Failed to get/create selected task for entity ${entityId}:`,
              createError
            );
            continue;
          }
        }
      }

      if (selectedTask.status === 'generating') {
        console.log(
          `Skipping entity ${entityId} - task already generating`
        );
        continue;
      }

      const queueItem = await createQueueItem(supabase, {
        project_id: projectId,
        repo_id: repoId,
        entity_id: entityId,
        task_id: taskId,
        selected_task_id: selectedTask.id,
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
