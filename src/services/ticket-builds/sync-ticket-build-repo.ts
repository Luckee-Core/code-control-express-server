import { updateTicketBuildRepo } from '../../data/ticket-build-repos';
import type { TicketBuildRepo } from '../../model/ticket-build-repo';
import { parseGithubRepoUrl } from '../../utils/parse-github-repo-url';
import type { CanonicalDataClient } from '../canonical-data-client';
import { getCursorRunStatus, prNumberFromUrl } from '../cursor-agents';
import { getPullRequest } from '../github';

/**
 * Brings one repo row up to date: a running agent → opened (PR url) or failed; an opened PR →
 * merged or closed on GitHub. Returns the row as it should be shown.
 */
export const syncTicketBuildRepo = async (client: CanonicalDataClient, repo: TicketBuildRepo): Promise<TicketBuildRepo> => {
  if (repo.status === 'running' && repo.cursor_agent_id && repo.cursor_run_id) {
    const status = await getCursorRunStatus(repo.cursor_agent_id, repo.cursor_run_id);
    if (status.state === 'running') return repo;
    const finishedAt = new Date().toISOString();
    if (status.state === 'failed') {
      return (await updateTicketBuildRepo(client, repo.id, { status: 'failed', error: status.error, finished_at: finishedAt })) ?? repo;
    }
    if (!status.prUrl) {
      return (
        (await updateTicketBuildRepo(client, repo.id, {
          status: 'failed',
          error: 'Agent finished but no pull request URL was found',
          finished_at: finishedAt,
        })) ?? repo
      );
    }
    return (
      (await updateTicketBuildRepo(client, repo.id, {
        status: 'opened',
        pr_url: status.prUrl,
        pr_number: prNumberFromUrl(status.prUrl),
        error: null,
        finished_at: finishedAt,
      })) ?? repo
    );
  }

  if (repo.status === 'opened' && repo.pr_number) {
    const parsed = parseGithubRepoUrl(repo.repo_url);
    if (!parsed.success) return repo;
    try {
      const pr = await getPullRequest({ owner: parsed.owner, repo: parsed.repo }, repo.pr_number);
      const next = pr.merged ? 'merged' : pr.state === 'closed' ? 'closed' : 'opened';
      if (next === repo.status) return repo;
      return (await updateTicketBuildRepo(client, repo.id, { status: next })) ?? repo;
    } catch (error) {
      console.warn('⚠️ [ticket-builds] PR sync failed', { repo: repo.repo_full_name, error: error instanceof Error ? error.message : error });
    }
  }
  return repo;
};
