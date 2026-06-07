/**
 * Process due Data Model generation queue items
 * Fetches and processes all queued items that are ready
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { getDueDataModelQueueItems } from '../../data/data-model-generation-queue';
import { processDataModelQueueItem } from './process-queue-item';

export type ProcessDueItemsResult = {
  processed: number;
  succeeded: number;
  failed: number;
};

export const processDueDataModelQueueItems = async (
  supabase: SupabaseClient
): Promise<ProcessDueItemsResult> => {
  console.log('🔄 Processing due data model queue items...');

  const dueItems = await getDueDataModelQueueItems(supabase);

  console.log(`📋 Found ${dueItems.length} due items to process`);

  if (dueItems.length === 0) {
    return { processed: 0, succeeded: 0, failed: 0 };
  }

  let succeeded = 0;
  let failed = 0;

  for (const item of dueItems) {
    const result = await processDataModelQueueItem(supabase, item);
    if (result.success) {
      succeeded++;
    } else {
      failed++;
    }
  }

  console.log(`✅ Processed ${dueItems.length} items: ${succeeded} succeeded, ${failed} failed`);

  return {
    processed: dueItems.length,
    succeeded,
    failed,
  };
};
