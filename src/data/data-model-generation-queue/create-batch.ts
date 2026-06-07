import type { SupabaseClient } from '@supabase/supabase-js';
import { createDataModelQueueItem } from './create';
import type { DataModelGenerationQueue } from './get-by-repo';

type CreateBatchInput = {
  project_id: string;
  repo_id: string;
  entity_ids: string[];
};

export const createBatchDataModelQueue = async (
  supabase: SupabaseClient,
  input: CreateBatchInput
): Promise<DataModelGenerationQueue[]> => {
  console.log('📦 Creating batch data model queue items:', {
    projectId: input.project_id,
    repoId: input.repo_id,
    entityCount: input.entity_ids.length,
  });

  const queueItems: DataModelGenerationQueue[] = [];

  for (const entityId of input.entity_ids) {
    // Fetch entity to get name for file path
    const { data: entity, error: entityError } = await supabase
      .from('data_entity')
      .select('name')
      .eq('id', entityId)
      .single();

    if (entityError) {
      console.error('❌ Error fetching entity:', entityError);
      continue;
    }

    const fileName = entity.name.toLowerCase().replace(/\s+/g, '-');
    const filePath = `src/model/${fileName}.ts`;

    const queueItem = await createDataModelQueueItem(supabase, {
      project_id: input.project_id,
      repo_id: input.repo_id,
      entity_id: entityId,
      file_path: filePath,
    });

    queueItems.push(queueItem);
  }

  console.log(`✅ Created ${queueItems.length} queue items`);
  return queueItems;
};
