/**
 * Build Data Model Generation Prompt
 * Fetches entity definition and builds prompt for TypeScript type generation
 */

import { SupabaseClient } from '@supabase/supabase-js';

export type BuildModelPromptInput = {
  supabase: SupabaseClient;
  entityId: string;
  repoName: string;
};

/**
 * Map database field types to TypeScript types
 */
const mapTypeToTypeScript = (type: string): string => {
  const typeMap: Record<string, string> = {
    string: 'string',
    text: 'string',
    number: 'number',
    integer: 'number',
    bigint: 'number',
    float: 'number',
    decimal: 'number',
    numeric: 'number',
    boolean: 'boolean',
    date: 'string',
    datetime: 'string',
    timestamp: 'string',
    uuid: 'string',
    json: 'Record<string, unknown>',
    jsonb: 'Record<string, unknown>',
    email: 'string',
    url: 'string',
    phone: 'string',
  };

  const normalizedType = type.toLowerCase().trim();
  return typeMap[normalizedType] || 'string';
};

/**
 * Build the prompt for data model generation
 */
export const buildModelPrompt = async (
  input: BuildModelPromptInput
): Promise<string> => {
  const { supabase, entityId, repoName } = input;

  console.log('🔍 buildModelPrompt: Fetching entity:', entityId);

  // Fetch entity with fields
  const { data: entity, error } = await supabase
    .from('data_entity')
    .select(`
      *,
      fields:data_entity_field(*)
    `)
    .eq('id', entityId)
    .single();

  if (error || !entity) {
    console.error('❌ buildModelPrompt: Entity not found:', entityId, error);
    throw new Error(`Entity not found: ${entityId}`);
  }

  console.log('✅ buildModelPrompt: Entity found:', entity.name);

  const entityName = entity.name;
  const tableName = entity.table_name || entity.name.toLowerCase();
  const fields = entity.fields || [];

  // Build field definitions
  const fieldLines = fields
    .sort((a: any, b: any) => a.sort_order - b.sort_order)
    .map((field: any) => {
      const tsType = mapTypeToTypeScript(field.type);
      const nullable = field.nullable ? ' | null' : '';
      return `  ${field.name}: ${tsType}${nullable};`;
    })
    .join('\n');

  // Build the prompt
  // Convert entity name to PascalCase for TypeScript type name (e.g., "Message Thread" → "MessageThread")
  const typeName = entityName
    .split(/\s+/)
    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
  const fileName = entityName.toLowerCase().replace(/\s+/g, '-');
  const filePath = `src/model/${fileName}.ts`;

  const prompt = `# Task
Create a TypeScript model file at ${filePath} for the ${entityName} entity in the ${repoName} repository.

# Entity Definition
- **Name:** ${entityName}
- **Table:** ${tableName}
- **Description:** ${entity.description || 'No description provided'}

# Type Structure
Generate a clean TypeScript type definition:

\`\`\`typescript
export type ${typeName} = {
${fieldLines}
};
\`\`\`

# Requirements
- Export a type named ${typeName} (PascalCase, no spaces)
- Create file at exactly: ${filePath}
- Use proper TypeScript types (string, number, boolean, Date)
- Add \` | null\` for nullable fields
- Simple type definition only (no Omit/Partial/Pick utilities)
- No additional helper types or functions
- Follow TypeScript best practices

# Important
- This is a pure type definition file
- Keep it simple and clean
- The type name should be ${typeName} exactly as shown (PascalCase)
- The file path should be ${filePath} exactly as shown (kebab-case)`;

  console.log('✅ buildModelPrompt: Prompt generated successfully');
  return prompt;
};
