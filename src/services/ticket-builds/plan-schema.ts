/** Structured-output JSON Schema for the ticket-build plan. */
export const TICKET_BUILD_PLAN_SCHEMA: Record<string, unknown> = {
  type: 'object',
  additionalProperties: false,
  required: ['summary', 'contract_markdown', 'missing_roles_note', 'repos'],
  properties: {
    summary: { type: 'string' },
    contract_markdown: { type: 'string' },
    missing_roles_note: { type: 'string' },
    repos: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['software_system_repo_id', 'changes_needed', 'plan_markdown'],
        properties: {
          software_system_repo_id: { type: 'string' },
          changes_needed: { type: 'boolean' },
          plan_markdown: { type: 'string' },
        },
      },
    },
  },
};
