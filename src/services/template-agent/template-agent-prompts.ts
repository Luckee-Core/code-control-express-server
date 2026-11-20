import type { ConventionChange } from '../../model/convention-change';

export const TEMPLATE_SELECT_SCHEMA: Record<string, unknown> = {
  type: 'object',
  additionalProperties: false,
  required: ['decision', 'not_needed_reason', 'files_to_read'],
  properties: {
    decision: { type: 'string', enum: ['continue', 'not_needed'] },
    not_needed_reason: { type: 'string', description: "Why this template repo needs no change. '' when continuing." },
    files_to_read: {
      type: 'array',
      description: 'Repo files (besides codegen/, which you always get) you need to read to make the change.',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['path', 'why'],
        properties: { path: { type: 'string' }, why: { type: 'string' } },
      },
    },
  },
};

export type TemplateSelectAnswer = {
  decision: 'continue' | 'not_needed';
  not_needed_reason: string;
  files_to_read: Array<{ path: string; why: string }>;
};

export const TEMPLATE_EDIT_SCHEMA: Record<string, unknown> = {
  type: 'object',
  additionalProperties: false,
  required: ['summary', 'decision', 'not_needed_reason', 'edits', 'deletes'],
  properties: {
    summary: { type: 'string', description: 'What the template PR changes and why, in 1-3 sentences.' },
    decision: { type: 'string', enum: ['edits', 'not_needed'] },
    not_needed_reason: { type: 'string', description: "'' when decision is edits." },
    edits: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['path', 'content', 'explanation', 'convention_keys'],
        properties: {
          path: { type: 'string', description: 'Repo-relative path.' },
          content: { type: 'string', description: 'Complete new file content.' },
          explanation: { type: 'string' },
          convention_keys: { type: 'array', items: { type: 'string' }, description: 'Convention keys this edit implements.' },
        },
      },
    },
    deletes: {
      type: 'array',
      description: 'Existing repo files to remove (e.g. a template the manifest no longer lists). [] when none.',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['path', 'explanation', 'convention_keys'],
        properties: {
          path: { type: 'string', description: 'Repo-relative path of an existing file.' },
          explanation: { type: 'string' },
          convention_keys: { type: 'array', items: { type: 'string' }, description: 'Convention keys this delete implements.' },
        },
      },
    },
  },
};

export type TemplateEditAnswer = {
  summary: string;
  decision: 'edits' | 'not_needed';
  not_needed_reason: string;
  edits: Array<{ path: string; content: string; explanation: string; convention_keys: string[] }>;
  deletes: Array<{ path: string; explanation: string; convention_keys: string[] }>;
};

export const TEMPLATE_SYSTEM_PROMPT = [
  'You are the template agent in Code Control. House conventions changed (the changes below are already applied in the conventions database). You update ONE template repo so it matches them.',
  '',
  'A template repo has three parts:',
  '- codegen/: manifest.json + Eta templates (<%= %>, <% %> with `-%>` newline trimming; `it` is the data model context, `it.h` string helpers). Code Control renders these into every project. If a convention changes how generated code looks, edit these templates. Keep the manifest valid JSON with the same structure.',
  '- the scaffold: the code new projects start from (src/, index.ts, …). Edit it when a convention changes how hand-written or starter code should look.',
  '- .cursor/architecture/: ADRs documenting the conventions. Update the ADR that sources each changed convention so docs match the database.',
  '',
  'Rules:',
  '- Make the smallest edits that implement the changed conventions. Do not refactor unrelated code.',
  '- Return complete file contents for every file you change.',
  '- Remove files that should no longer exist with `deletes` (e.g. a codegen template whose manifest entry you removed, or scaffold code a convention retires). Update the manifest, imports and barrels that referenced them in the same answer.',
  '- Preserve whitespace exactly in templates; generated output is compared byte for byte.',
  '- If nothing in this repo needs to change (e.g. a wording-only refine with no ADR text to update, or a rule for another role), answer not_needed with the reason.',
].join('\n');

/** Human-readable description of the changes a template run carries. */
export const describeCarriedChanges = (changes: ConventionChange[]): string =>
  changes
    .map((change) =>
      [
        `## ${change.change_type} \`${change.convention_key}\` (domain ${change.domain_key}; roles ${change.role_keys.join(', ') || 'all'})`,
        change.reason ? `Reason: ${change.reason}` : '',
        change.changed_fields.length > 0 ? `Changed fields: ${change.changed_fields.join(', ')}` : '',
        `Before: ${change.before ? JSON.stringify(pickFields(change.before, change.changed_fields)) : '(new)'}`,
        `After: ${change.after ? JSON.stringify(pickFields(change.after, change.changed_fields)) : '(deleted)'}`,
      ]
        .filter(Boolean)
        .join('\n'),
    )
    .join('\n\n');

const pickFields = (row: Record<string, unknown>, fields: string[]): Record<string, unknown> => {
  if (fields.length === 0) return row;
  const keep = new Set([...fields, 'key', 'title', 'statement', 'severity', 'status']);
  return Object.fromEntries(Object.entries(row).filter(([field]) => keep.has(field)));
};
