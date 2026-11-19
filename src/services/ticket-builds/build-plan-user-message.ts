import type { TicketBuildRepo } from '../../model/ticket-build-repo';
import type { TicketBuildContext } from './types';

const section = (tag: string, body: string): string => `<${tag}>\n${body.trim()}\n</${tag}>`;

/**
 * User message for the plan step: ticket, optional ops research, then each repo (role, tree, docs,
 * conventions). For a revise, the current (possibly edited) plan and the feedback come last.
 */
export const buildTicketBuildPlanUserMessage = (
  context: TicketBuildContext,
  revise: { feedback: string; repos: TicketBuildRepo[] } | null,
): string => {
  const { build } = context;
  const parts: string[] = [
    section(
      'ticket',
      [`Title: ${build.ops_ticket_title}`, `Description: ${build.ops_ticket_description?.trim() || '(none)'}`].join('\n'),
    ),
  ];

  if (context.research) {
    const lines = [context.research.summary ?? ''];
    for (const part of context.research.parts) {
      lines.push(`- [${part.layer}] ${part.title}: ${part.description}${part.candidates.length ? ` (candidates: ${part.candidates.join(', ')})` : ''}`);
    }
    parts.push(section('earlier_research', `High-level research done earlier for this ticket (background only):\n${lines.join('\n')}`));
  }

  for (const repo of context.repos) {
    const lines = [
      `software_system_repo_id: ${repo.repo.software_system_repo_id}`,
      `repo: ${repo.repo.repo_full_name}`,
      `role: ${repo.roleName}${repo.roleDescription ? ` — ${repo.roleDescription}` : ''}`,
    ];
    if (repo.readError) lines.push(`(Could not read this repo: ${repo.readError})`);
    for (const doc of repo.docs) lines.push('', `### ${doc.path}`, doc.text);
    if (repo.tree.length > 0) {
      lines.push('', `### File tree${repo.treeTruncated ? ' (truncated)' : ''}`, repo.tree.join('\n'));
    }
    if (repo.conventionsText) lines.push('', '### Conventions for this role', repo.conventionsText);
    parts.push(section('repo', lines.join('\n')));
  }

  parts.push(section('system', `Software system: ${context.systemName}. Plan only for the repos above.`));

  if (revise) {
    const current = [
      `Contract:\n${build.contract_text || '(empty)'}`,
      ...revise.repos.map((repo) => `Plan for ${repo.repo_full_name} (${repo.included ? 'included' : 'excluded'}):\n${repo.plan_text || '(empty)'}`),
    ].join('\n\n');
    parts.push(section('current_plan', `The current plan, possibly edited by the user. Keep what the feedback doesn't change.\n\n${current}`));
    parts.push(section('feedback', revise.feedback));
  }

  return parts.join('\n\n');
};
