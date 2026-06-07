export type BuildARDPromptInput = {
  promptTemplate: string;
  repoName: string;
  stackType: string;
  conventions: Array<{ name: string; content: string }>;
  examples: Array<{ name: string; code: string }>;
  outputPath: string;
};

/**
 * Build ARD prompt from template by replacing Handlebars-style variables
 * 
 * @param input - Template and data
 * @returns Fully built prompt string
 */
export const buildARDPrompt = (input: BuildARDPromptInput): string => {
  const {
    promptTemplate,
    repoName,
    stackType,
    conventions,
    examples,
    outputPath,
  } = input;
  
  const conventionsText = conventions.length > 0
    ? conventions.map(c => `### ${c.name}\n${c.content}`).join('\n\n')
    : 'No specific conventions provided.';
  
  const examplesText = examples.length > 0
    ? examples.map(e => `### ${e.name}\n\`\`\`typescript\n${e.code}\n\`\`\``).join('\n\n')
    : 'No examples provided.';
  
  let prompt = promptTemplate;
  
  prompt = prompt.replace(/\{\{repoName\}\}/g, repoName);
  prompt = prompt.replace(/\{\{stackType\}\}/g, stackType);
  prompt = prompt.replace(/\{\{outputPath\}\}/g, outputPath);
  prompt = prompt.replace(/\{\{conventions\}\}/g, conventionsText);
  prompt = prompt.replace(/\{\{examples\}\}/g, examplesText);
  
  return prompt;
};
