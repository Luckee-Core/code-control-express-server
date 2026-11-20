import type { TicketBuild } from '../../model/ticket-build';
import type { TicketBuildRepo } from '../../model/ticket-build-repo';

const firstLine = (text: string): string => text.split('\n').map((line) => line.trim()).find(Boolean) ?? '';

/**
 * Prompt for one repo's Cursor agent: the ticket, the shared contract (verbatim), this repo's plan,
 * a one-line scope for each sibling repo, and the PR rules. Pure.
 */
export const buildRepoAgentPrompt = (input: {
  build: TicketBuild;
  repo: TicketBuildRepo;
  siblings: TicketBuildRepo[];
  conventionsText: string;
}): string => {
  const { build, repo, siblings } = input;
  const others = siblings
    .filter((sibling) => sibling.id !== repo.id && sibling.included)
    .map((sibling) => `- ${sibling.repo_full_name} (${sibling.role}): ${firstLine(sibling.plan_text)}`);

  return `You are implementing one part of a ticket that spans several repositories. Other agents are implementing the other parts in parallel, each in its own repo. Implement ONLY this repository's part.

Repository: ${repo.repo_full_name} (role: ${repo.role})

Ticket (My Ops Tracker ${build.ops_ticket_id}): ${build.ops_ticket_title}
${build.ops_ticket_description?.trim() || ''}

## Shared contract (follow exactly; do not rename anything in it)
${build.contract_text || '(none)'}

## Plan for this repository
${repo.plan_text}

## Other repositories in this change (for context only; do not edit them)
${others.length > 0 ? others.join('\n') : '- none'}

${input.conventionsText ? `## Team conventions for this role\n${input.conventionsText}\n` : ''}
Before changing code:
- Read \`CLAUDE.md\` and \`.cursor/rules/AGENTS.md\` if present, then the relevant ADRs under \`.cursor/architecture/\`.
- Match existing naming, file layout and patterns in this repository.

Requirements:
- Implement this repository's plan completely; stay within its scope.
- Use the contract's names, shapes and paths exactly, so the other repositories' changes fit.
- Add or update tests only where this repository already has them for similar code.
- Do not create, edit or delete any Markdown (.md) file: no README, CHANGELOG, CONTRIBUTING, SECURITY, docs/, ADRs, CLAUDE.md or AGENTS.md. Read them for context only; a separate README agent owns them. If the plan mentions a .md file, skip that part and say so in the pull request body.
- Open a pull request titled "${build.ops_ticket_title} (${repo.role})". In the body, reference ticket ${build.ops_ticket_id} and Code Control build ${build.id}, and list any assumptions you made.`;
};
