/**
 * Process Data Model Generation Queue with Locking
 * 
 * Processes queued data model generation tasks by checking each project+repo combination
 * and triggering the first queued item if the project+repo is available (not currently running).
 * 
 * HOW IT WORKS:
 * 
 * 1. Get all projects and repos from database
 * 2. For each project:
 *    - Query running items to find which repos are locked
 *    - For each repo:
 *      - Skip if project+repo is locked (already running)
 *      - Query first queued item for this project+repo
 *      - If found, mark as processing and trigger generation
 * 
 * KEY CONCEPT: Locking is per project+repo combination
 * - Project A can run data model tasks for Repo 1 and Repo 2 simultaneously
 * - Project A cannot run two data model tasks for Repo 1 at the same time
 * 
 * EXAMPLE:
 * - Projects: [A, B], Repos: [1, 2, 3]
 * - Project A has Repo 1 locked (processing User model)
 * - Result: Can trigger items for A/2, A/3, B/1, B/2, B/3
 *           Cannot trigger for A/1 (locked)
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { processDataModelQueueItem } from './process-queue-item';

type QueueProcessResult = {
  processed: number;
  triggered: string[];
  skipped: number;
};

type QueueItem = {
  id: string;
  entity_id: string;
  project_id: string;
  repo_id: string;
  created_at: string;
};

/**
 * Process all pending data model queue items with locking
 * For each project+repo combo, trigger the first queued item if combo is free
 */
export const processDataModelQueue = async (
  supabase: SupabaseClient
): Promise<QueueProcessResult> => {
  console.log('\n📋 Processing data model queue...');

  // Step 1: Get all projects
  const { data: projects, error: projectsError } = await supabase
    .from('customer_projects')
    .select('id, name');

  if (projectsError) {
    console.error('   ❌ Failed to query projects:', projectsError);
    throw new Error(`Failed to query projects: ${projectsError.message}`);
  }

  if (!projects || projects.length === 0) {
    console.log('   ✅ No projects found');
    return { processed: 0, triggered: [], skipped: 0 };
  }

  // Step 2: Get all repos
  const { data: repos, error: reposError } = await supabase
    .from('customer_project_repos')
    .select('id, name');

  if (reposError) {
    console.error('   ❌ Failed to query repos:', reposError);
    throw new Error(`Failed to query repos: ${reposError.message}`);
  }

  if (!repos || repos.length === 0) {
    console.log('   ✅ No repos found');
    return { processed: 0, triggered: [], skipped: 0 };
  }

  console.log(`   📊 Processing ${projects.length} project(s) × ${repos.length} repo(s) = ${projects.length * repos.length} combinations`);

  const triggered: string[] = [];
  let skipped = 0;
  let totalProcessed = 0;

  // Step 3: For each project, find locked repos and process non-locked ones
  for (const project of projects) {
    console.log(`\n   🔍 Project: ${project.name} (${project.id})`);

    // Get all processing items for this project
    const { data: processingItems, error: processingError } = await supabase
      .from('data_model_generation_queue')
      .select('repo_id, id, entity_id')
      .eq('project_id', project.id)
      .eq('status', 'processing');

    if (processingError) {
      console.error(`      ❌ Error querying processing items:`, processingError);
      continue;
    }

    // Build set of locked repo_ids for this project
    const lockedRepos = new Set(processingItems?.map(item => item.repo_id) || []);
    
    if (lockedRepos.size > 0) {
      console.log(`      🔒 ${lockedRepos.size} repo(s) locked:`);
      processingItems?.forEach(item => {
        console.log(`         - Repo ${item.repo_id}: Entity ${item.entity_id} (${item.id})`);
      });
    } else {
      console.log(`      ✅ No locked repos for this project`);
    }

    // Step 4: For each repo, check if locked and process if free
    for (const repo of repos) {
      totalProcessed++;

      // Skip if this project+repo combo is locked
      if (lockedRepos.has(repo.id)) {
        skipped++;
        continue;
      }

      // Get FIRST queued item for this project+repo (scheduled_at <= now OR null)
      const now = new Date().toISOString();
      const { data: nextItem, error: queuedError } = await supabase
        .from('data_model_generation_queue')
        .select('*')
        .eq('project_id', project.id)
        .eq('repo_id', repo.id)
        .eq('status', 'queued')
        .or(`scheduled_at.lte.${now},scheduled_at.is.null`)
        .order('scheduled_at', { ascending: true, nullsFirst: true })
        .limit(1)
        .maybeSingle();

      if (queuedError) {
        console.error(`      ❌ Error querying queued items for repo ${repo.id}:`, queuedError);
        continue;
      }

      if (!nextItem) {
        // No queued items for this combo - that's fine, just continue
        continue;
      }

      // Found a queued item - process it!
      console.log(`\n      🚀 Processing data model generation`);
      console.log(`         Queue ID: ${nextItem.id}`);
      console.log(`         Entity ID: ${nextItem.entity_id}`);
      console.log(`         Repo: ${repo.name} (${repo.id})`);
      console.log(`         Scheduled: ${nextItem.scheduled_at}`);

      try {
        // Mark as processing
        const { error: updateError } = await supabase
          .from('data_model_generation_queue')
          .update({
            status: 'processing',
            started_at: new Date().toISOString()
          })
          .eq('id', nextItem.id);

        if (updateError) {
          console.error(`         ❌ Failed to mark as processing:`, updateError);
          skipped++;
          continue;
        }
        
        // Process the queue item
        const result = await processDataModelQueueItem(supabase, nextItem as any);

        if (result.success) {
          console.log(`         ✅ Processed successfully`);
          triggered.push(nextItem.id);
        } else {
          console.error(`         ❌ Processing failed: ${result.error}`);
          skipped++;
        }

      } catch (error: any) {
        console.error(`         ❌ Failed to process:`, error.message);

        // Mark as failed
        await supabase
          .from('data_model_generation_queue')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
            error_message: error.message
          })
          .eq('id', nextItem.id);

        skipped++;
      }
    }
  }

  console.log(`\n   📊 Queue processing complete:`);
  console.log(`      Triggered: ${triggered.length}`);
  console.log(`      Skipped: ${skipped}`);
  console.log(`      Total combinations checked: ${totalProcessed}`);

  return {
    processed: totalProcessed,
    triggered,
    skipped
  };
};
