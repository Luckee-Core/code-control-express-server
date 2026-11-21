import type { AgentRun, PrAgentEdit } from '../../model/agent-run';
import { fenceFile } from '../agent-runs/file-text';
import type { DeliveryPr } from './read-delivery-pr';

/** JSON Schema for the PR agent's answer (every key required, no extras). */
export const PR_AGENT_SCHEMA: Record<string, unknown> = {
  type: 'object',
  additionalProperties: false,
  required: ['summary', 'edits', 'deletes', 'notes'],
  properties: {
    summary: { type: 'string', description: 'What you changed and why, in 1-3 sentences.' },
    edits: {
      type: 'array',
      description: 'One entry per file you change. Leave files you do not change out.',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['path', 'content', 'explanation'],
        properties: {
          path: { type: 'string', description: 'Repo-relative path, exactly as listed in the PR files.' },
          content: { type: 'string', description: 'The complete new file content (not a diff).' },
          explanation: { type: 'string', description: 'Why this file changes, citing convention keys where relevant.' },
        },
      },
    },
    deletes: {
      type: 'array',
      description: 'PR files to remove from the branch (e.g. files nothing imports any more). [] when none.',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['path', 'explanation'],
        properties: {
          path: { type: 'string', description: 'Repo-relative path, exactly as listed in the PR files.' },
          explanation: { type: 'string', description: 'Why the file goes away, citing convention keys where relevant.' },
        },
      },
    },
    notes: { type: 'array', items: { type: 'string' }, description: 'Anything the reviewer should know (risks, follow-ups). [] when none.' },
  },
};

export type PrAgentAnswer = {
  summary: string;
  edits: Array<{ path: string; content: string; explanation: string }>;
  deletes: Array<{ path: string; explanation: string }>;
  notes: string[];
};

/** System prompt: the PR agent only changes this PR, guided by the conventions. */
export const buildPrAgentSystemPrompt = (conventionsText: string): string =>
  [
    'You are the PR agent in Code Control. You revise one generated pull request in a project repo based on feedback from the reviewer.',
    '',
    'Rules:',
    '- Change only what the feedback asks for, plus what is needed to keep the code consistent (imports, barrels, callers inside this PR).',
    '- Return the complete new content of every file you change. Do not return unchanged files.',
    '- Only edit files that are part of the PR unless the feedback clearly needs a new file.',
    '- When a change leaves a PR file unused (nothing imports it any more), delete it with `deletes` instead of leaving it behind, and update every import and barrel that pointed at it. You can only delete files that are part of the PR.',
    '- Follow the conventions below. When the feedback contradicts a convention, follow the feedback and say so in notes, citing the convention key. Updating conventions is not your job; another agent does that later.',
    '- Keep the existing code style (naming, quotes, formatting, logging, JSDoc).',
    '',
    '# Conventions for this repo role',
    '',
    conventionsText,
  ].join('\n');


/** User message: feedback, focus files, earlier versions and the PR files. */
export const buildPrAgentUserMessage = (input: {
  run: AgentRun;
  pr: DeliveryPr;
  feedback: string;
  focusPaths: string[];
  previous: Array<{ run: AgentRun; edits: PrAgentEdit[] }>;
}): string => {
  const { run, pr } = input;
  const lines: string[] = [
    `# Pull request`,
    `${pr.delivery.repo_full_name} PR #${pr.delivery.pr_number} (branch ${pr.delivery.branch}, role ${pr.delivery.role}, ${pr.delivery.kind === 'crud' ? 'data-access layer' : pr.delivery.kind === 'layout' ? 'app layout' : pr.delivery.kind === 'list' ? 'list pages' : pr.delivery.kind === 'detail' ? 'detail pages' : pr.delivery.kind === 'dashboard' ? 'dashboard' : 'data model'}).`,
    '',
    '# Feedback from the reviewer',
    input.feedback.trim(),
  ];
  if (input.focusPaths.length > 0) {
    lines.push('', 'The reviewer pointed at these files:', ...input.focusPaths.map((path) => `- ${path}`));
  }
  if (run.instructions.trim()) {
    lines.push('', '# Extra instructions', run.instructions.trim());
  }
  for (const version of input.previous) {
    lines.push(
      '',
      `# Earlier attempt (v${version.run.version}, ${version.run.status})`,
      `Feedback: ${String(version.run.input.feedback ?? '').trim()}`,
      `Summary: ${version.run.summary}`,
      `Files changed: ${version.edits.filter((edit) => edit.after_content !== null).map((edit) => edit.path).join(', ') || 'none'}`,
      `Files deleted: ${version.edits.filter((edit) => edit.after_content === null).map((edit) => edit.path).join(', ') || 'none'}`,
    );
    if (version.run.decision_note.trim()) lines.push(`Reviewer's response: ${version.run.decision_note.trim()}`);
  }
  lines.push('', '# PR files (current content at the branch head)', '');
  for (const file of pr.files) lines.push(fenceFile(file.path, file.content), '');
  if (pr.omitted.length > 0) {
    lines.push('These PR files were left out for size (ask for them via notes if you need them):', ...pr.omitted.map((path) => `- ${path}`));
  }
  return lines.join('\n');
};
