/**
 * Build CRUD API Generation Prompt
 * Takes a prompt template and injects entity data, conventions, and examples.
 * Replaces all snake_case placeholders so the prompt never contains unreplaced variables.
 */

type EntityField = {
  name: string;
  type: string;
  nullable?: boolean;
};

type BuildCrudPromptInput = {
  promptTemplate: string;
  entityName: string;
  tableName: string | null;
  filePath: string;
  operationKey: string;
  conventions: Array<{ name: string; content: string }>;
  examples: Array<{ name: string; code: string }>;
  /** Entity fields for {{entity_fields}} and {{input_fields}}. Optional for tasks that don't need them. */
  entityFields?: EntityField[];
};

/**
 * Build the full prompt for CRUD API generation by replacing template variables
 * (snake_case only) and appending conventions and examples.
 */
export const buildCrudPrompt = (input: BuildCrudPromptInput): string => {
  const {
    promptTemplate,
    entityName,
    tableName: tableNameInput,
    filePath,
    operationKey,
    conventions,
    examples,
    entityFields = [],
  } = input;

  const entitySlug = (entityName || '').toLowerCase().replace(/\s+/g, '-');
  const tableName =
    tableNameInput?.trim() || entitySlug.replace(/-/g, '_');

  const entityFieldsText =
    entityFields
      .map((f) => `  ${f.name}: ${f.type}${f.nullable !== false ? ' | null' : ''};`)
      .join('\n') || '  // No fields defined';

  const inputFieldsText =
    entityFields
      .filter((f) => !['id', 'created_at', 'updated_at'].includes(f.name))
      .map((f) => `  ${f.name}${f.nullable !== false ? '?' : ''}: ${f.type};`)
      .join('\n') || '  // No input fields';

  const conventionsText =
    conventions
      .map((c) => `- **${c.name}**: ${c.content}`)
      .join('\n') || 'None specified.';

  // Replace all snake_case template variables
  let prompt = promptTemplate
    .replace(/\{\{entity_name\}\}/g, entityName)
    .replace(/\{\{entity_slug\}\}/g, entitySlug)
    .replace(/\{\{table_name\}\}/g, tableName)
    .replace(/\{\{file_path\}\}/g, filePath)
    .replace(/\{\{operation_key\}\}/g, operationKey)
    .replace(/\{\{entity_fields\}\}/g, entityFieldsText)
    .replace(/\{\{input_fields\}\}/g, inputFieldsText)
    .replace(/\{\{conventions\}\}/g, conventionsText);

  // Force the model to use these exact names (avoids generic "EntityName" / "table_name" output)
  prompt += `\n\n## CRITICAL — use these exact names in your generated code\n- Entity/type name: **${entityName}** (e.g. type ${entityName}, getAll${entityName}, get${entityName}ById)\n- Table name: **${tableName}** (e.g. .from('${tableName}'))\n- Do NOT use placeholder names like EntityName or table_name.\n`;

  // Use existing src/model for types — do not define entity types in src/data
  prompt += `\n\n## CRITICAL — types live in src/model\n- Import the **${entityName}** type from \`src/model\` (e.g. \`import { ${entityName} } from '../../model';\` or \`from '@/model'\` depending on project aliases).\n- Do NOT define or re-export the entity type in \`get-all.ts\`, \`get-by-id.ts\`, or any other file under \`src/data\`. The type already exists in \`src/model\`.\n- Data layer files under \`src/data/${entitySlug}\` should only contain functions; import the type from \`src/model\`.\n`;

  // Create: accept entity: EntityName (no CreateXInput). Update: accept updates: Partial<EntityName> (no UpdateXInput).
  if (operationKey === 'create') {
    prompt += `\n\n## CRITICAL — create signature\n- Do NOT define or use Create${entityName}Input or any other input type.\n- Signature must be: create${entityName}(supabase, entity: ${entityName}): Promise<${entityName}>.\n- In the function body, omit id, created_at, updated_at when calling .insert() (e.g. destructure: const { id, created_at, updated_at, ...row } = entity; then .insert(row)).\n`;
  } else if (operationKey === 'update') {
    prompt += `\n\n## CRITICAL — update signature\n- Do NOT define or use Update${entityName}Input or reference Create${entityName}Input.\n- Signature must be: update${entityName}(supabase, id: string, updates: Partial<${entityName}>): Promise<${entityName}>.\n`;
  }

  // Append conventions section if not already in template
  if (conventions.length > 0 && !prompt.includes('## Conventions')) {
    prompt += '\n\n## Conventions\n\n';
    conventions.forEach((conv) => {
      prompt += `### ${conv.name}\n\n${conv.content}\n\n`;
    });
  }

  if (examples.length > 0) {
    prompt += '\n\n## Examples\n\n';
    examples.forEach((ex) => {
      prompt += `### ${ex.name}\n\n\`\`\`\n${ex.code}\n\`\`\`\n\n`;
    });
  }

  return prompt;
};
