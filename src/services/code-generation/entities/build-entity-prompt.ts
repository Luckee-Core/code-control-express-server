import { mapDbTypeToTs } from './map-db-type-to-ts';

export type EntityField = {
  name: string;
  type: string;
  nullable: boolean;
};

export type BuildEntityPromptInput = {
  promptTemplate: string;
  entityName: string;
  tableName: string;
  fields: EntityField[];
  conventions: Array<{ name: string; content: string }>;
  examples: Array<{ name: string; code: string }>;
  outputPath: string;
};

/**
 * Build prompt from template by replacing Handlebars-style variables
 * 
 * @param input - Template and data
 * @returns Fully built prompt string
 */
export const buildEntityPrompt = (input: BuildEntityPromptInput): string => {
  const {
    promptTemplate,
    entityName,
    tableName,
    fields,
    conventions,
    examples,
    outputPath,
  } = input;
  
  const conventionsText = conventions.length > 0
    ? conventions.map(c => `- ${c.name}: ${c.content}`).join('\n')
    : 'No specific conventions provided.';
  
  const examplesText = examples.length > 0
    ? examples.map(e => `\`\`\`typescript\n${e.code}\n\`\`\``).join('\n\n')
    : 'No examples provided.';
  
  const fieldsText = fields
    .map(f => {
      const tsType = mapDbTypeToTs(f.type);
      const nullableSuffix = f.nullable ? ' | null' : '';
      return `- ${f.name}: ${tsType}${nullableSuffix}`;
    })
    .join('\n');
  
  let prompt = promptTemplate;
  
  prompt = prompt.replace(/\{\{entityName\}\}/g, entityName);
  prompt = prompt.replace(/\{\{entityNameLower\}\}/g, entityName.toLowerCase());
  prompt = prompt.replace(/\{\{tableName\}\}/g, tableName);
  prompt = prompt.replace(/\{\{outputPath\}\}/g, outputPath);
  prompt = prompt.replace(/\{\{timestamp\}\}/g, Date.now().toString());
  
  prompt = prompt.replace(/\{\{conventions\}\}/g, conventionsText);
  prompt = prompt.replace(/\{\{examples\}\}/g, examplesText);
  prompt = prompt.replace(/\{\{fields\}\}/g, fieldsText);
  
  return prompt;
};
