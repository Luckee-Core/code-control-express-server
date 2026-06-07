import { getManagedSupabaseClient } from '../../db/supabase-client';
import { DataEntity, DataEntityField } from '../../db/types';

type DataEntityWithFields = DataEntity & {
  fields: DataEntityField[];
};

export const getAllDataEntities = async (): Promise<DataEntityWithFields[]> => {
  const supabase = getManagedSupabaseClient();

  const { data: entities, error: entitiesError } = await supabase
    .from('data_entity')
    .select('*')
    .order('created_at', { ascending: false});

  if (entitiesError) {
    console.error('Error fetching all data entities:', entitiesError);
    throw entitiesError;
  }

  if (!entities || entities.length === 0) {
    return [];
  }

  const { data: fields, error: fieldsError } = await supabase
    .from('data_entity_field')
    .select('*')
    .in('entity_id', entities.map((e) => e.id))
    .order('sort_order', { ascending: true });

  if (fieldsError) {
    console.error('Error fetching data entity fields:', fieldsError);
    throw fieldsError;
  }

  const fieldsByEntity = (fields || []).reduce((acc, field) => {
    if (!acc[field.entity_id]) {
      acc[field.entity_id] = [];
    }
    acc[field.entity_id].push(field);
    return acc;
  }, {} as Record<string, DataEntityField[]>);

  return entities.map((entity) => ({
    ...entity,
    fields: fieldsByEntity[entity.id] || [],
  }));
};
