/**
 * Build CRUD API Prompt
 * Generates a complete prompt by replacing placeholders in task template with entity data and conventions
 */

type EntityField = {
  name: string;
  type: string;
  required: boolean;
};

type Entity = {
  name: string;
  table_name: string | null;
  fields?: EntityField[];
};

type Convention = {
  name: string;
  content: string;
  tags: string[];
};

type CrudApiTask = {
  prompt_template: string;
  operation_key: string;
};

export const buildCrudApiPrompt = (
  task: CrudApiTask,
  entity: Entity,
  conventions: Convention[]
): string => {
  const entitySlug = (entity.name || '').toLowerCase().replace(/\s+/g, '-');
  const tableName = entity.table_name || entitySlug.replace(/-/g, '_');
  
  // Format entity fields for display
  const entityFields = entity.fields
    ?.map((f) => `  ${f.name}: ${f.type}${f.required ? '' : ' | null'};`)
    .join('\n') || '  // No fields defined';

  // Format input fields (exclude system fields)
  const inputFields = entity.fields
    ?.filter((f) => !['id', 'created_at', 'updated_at'].includes(f.name))
    .map((f) => `  ${f.name}${f.required ? '' : '?'}: ${f.type};`)
    .join('\n') || '  // No input fields';

  // Format conventions
  const conventionsText = conventions
    .map((c) => `- **${c.name}**: ${c.content}`)
    .join('\n');

  // Replace placeholders in template
  return task.prompt_template
    .replace(/\{\{entity_name\}\}/g, entity.name)
    .replace(/\{\{entity_slug\}\}/g, entitySlug)
    .replace(/\{\{table_name\}\}/g, tableName)
    .replace(/\{\{entity_fields\}\}/g, entityFields)
    .replace(/\{\{input_fields\}\}/g, inputFields)
    .replace(/\{\{conventions\}\}/g, conventionsText);
};
