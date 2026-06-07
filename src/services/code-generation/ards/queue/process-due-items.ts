/**
 * Process Due ARD Generation Queue Items
 * Gets next due item (LIMIT 1) and processes it
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { getDueARDQueueItems } from '../../../../data/ard-generation-queue';
import { processARDQueueItem } from './process-queue-item';

export type ProcessDueARDItemsResult = {
  success: boolean;
  processed: number;
  successful: number;
  failed: number;
  errors: string[];
};

export const processDueARDItems = async (
  supabase: SupabaseClient
): Promise<ProcessDueARDItemsResult> => {
  const result: ProcessDueARDItemsResult = {
    success: true,
    processed: 0,
    successful: 0,
    failed: 0,
    errors: [],
  };

  try {
    const dueItems = await getDueARDQueueItems(supabase, 1);

    if (dueItems.length === 0) {
      console.log('No due ARD generation queue items to process');
      return result;
    }

    console.log(`Processing 1 ARD generation queue item`);

    const item = dueItems[0];
    result.processed++;

    try {
      const processResult = await processARDQueueItem(supabase, item);

      if (processResult.success) {
        result.successful++;
        console.log(
          `✅ Successfully processed ARD queue item ${item.id} (task ${item.task_id})`
        );
      } else {
        result.failed++;
        result.errors.push(
          `Queue item ${item.id}: ${processResult.error || 'Unknown error'}`
        );
        console.error(`❌ Failed ARD queue item ${item.id}:`, processResult.error);
      }
    } catch (error) {
      result.failed++;
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(`Queue item ${item.id}: ${errorMessage}`);
      console.error(`❌ Error processing ARD queue item ${item.id}:`, error);
    }

    console.log(
      `ARD generation queue processing complete: ${result.successful} successful, ${result.failed} failed`
    );

    return result;
  } catch (error) {
    console.error('Error processing due ARD generation queue:', error);
    result.success = false;
    result.errors.push(
      error instanceof Error ? error.message : 'Unknown error'
    );
    return result;
  }
};
