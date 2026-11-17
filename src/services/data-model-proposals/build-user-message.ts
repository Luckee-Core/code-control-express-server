import type { DataModelProposalContent, ProposalWarning } from '../../model/data-model-proposal';
import type { SoftwareSystem } from '../../model/software-system';

export type UserMessageInput = {
  softwareSystem: Pick<SoftwareSystem, 'name' | 'description'>;
  contextText: string;
  /** Previous version to revise, when this is a revision. */
  previousProposal: DataModelProposalContent | null;
  feedback: string;
  /** Rule violations from the previous attempt in this run (auto-fix pass). */
  violations: ProposalWarning[];
};

/**
 * Builds the user message: the product, the user's context text, and (for revisions or
 * auto-fix passes) the previous proposal plus what to change.
 */
export const buildUserMessage = (input: UserMessageInput): string => {
  const parts: string[] = [];
  parts.push(`# Product: ${input.softwareSystem.name}`);
  if (input.softwareSystem.description?.trim()) {
    parts.push(input.softwareSystem.description.trim());
  }
  parts.push('', '## Context from the product owner', '<context>', input.contextText.trim(), '</context>');

  if (input.previousProposal) {
    parts.push(
      '',
      '## Previous proposal',
      '```json',
      JSON.stringify(input.previousProposal, null, 2),
      '```',
    );
  }
  if (input.feedback.trim()) {
    parts.push('', '## Revision feedback from the product owner', input.feedback.trim());
  }
  if (input.violations.length > 0) {
    parts.push(
      '',
      '## Convention violations to fix',
      'The previous proposal broke these rules. Return a corrected full proposal.',
      ...input.violations.map(
        (violation) =>
          `- [${violation.convention_key}] ${violation.table}${violation.column ? `.${violation.column}` : ''}: ${violation.message}`,
      ),
    );
  }

  parts.push(
    '',
    input.previousProposal
      ? 'Return the complete revised proposal.'
      : 'Propose the core tables for this product.',
  );
  return parts.join('\n');
};
