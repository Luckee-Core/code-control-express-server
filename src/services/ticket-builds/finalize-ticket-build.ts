import { updateTicketBuild } from '../../data/ticket-builds';
import type { TicketBuild, TicketBuildStatus } from '../../model/ticket-build';
import type { TicketBuildRepo } from '../../model/ticket-build-repo';
import { parseGithubRepoUrl } from '../../utils/parse-github-repo-url';
import type { CanonicalDataClient } from '../canonical-data-client';
import { getPullRequestBody, updatePullRequestBody } from '../github';
import { updateOpsTicketPullRequest } from '../ops-tracker-client';

const RELATED_MARKER = '<!-- code-control-related-prs -->';
const BUILD_STATUSES: TicketBuildStatus[] = ['building', 'opened', 'partial', 'failed', 'merged'];

/** Build status from its included repos (null when the build isn't in the build phase). */
export const computeBuildStatus = (build: TicketBuild, repos: TicketBuildRepo[]): TicketBuildStatus | null => {
  if (!BUILD_STATUSES.includes(build.status)) return null;
  const active = repos.filter((repo) => repo.included && repo.status !== 'skipped');
  if (active.length === 0) return build.status;
  if (active.some((repo) => repo.status === 'running' || repo.status === 'pending')) return 'building';
  const withPr = active.filter((repo) => ['opened', 'merged', 'closed'].includes(repo.status));
  if (withPr.length === 0) return 'failed';
  if (withPr.length < active.length) return 'partial';
  return active.every((repo) => repo.status === 'merged') ? 'merged' : 'opened';
};

const linkSiblingPullRequests = async (repos: TicketBuildRepo[]): Promise<void> => {
  const withPr = repos.filter((repo) => repo.pr_url && repo.pr_number);
  if (withPr.length < 2) return;
  for (const repo of withPr) {
    const parsed = parseGithubRepoUrl(repo.repo_url);
    if (!parsed.success || !repo.pr_number) continue;
    const ref = { owner: parsed.owner, repo: parsed.repo };
    try {
      const body = await getPullRequestBody(ref, repo.pr_number);
      if (body.includes(RELATED_MARKER)) continue;
      const lines = withPr
        .filter((sibling) => sibling.id !== repo.id)
        .map((sibling) => `- ${sibling.repo_full_name} (${sibling.role}): ${sibling.pr_url}`);
      await updatePullRequestBody(ref, repo.pr_number, `${body}\n\n${RELATED_MARKER}\n### Related PRs (Code Control ticket build)\n${lines.join('\n')}\n`);
    } catch (error) {
      console.warn('⚠️ [ticket-builds] Could not link sibling PRs', { repo: repo.repo_full_name, error: error instanceof Error ? error.message : error });
    }
  }
};

/** The PR to show on the ops ticket: web/mobile first, else the first PR by position. */
const primaryPrUrl = (repos: TicketBuildRepo[]): string | null => {
  const withPr = repos.filter((repo) => repo.pr_url);
  return (withPr.find((repo) => repo.role === 'web' || repo.role === 'mobile') ?? withPr[0])?.pr_url ?? null;
};

/**
 * Updates the build status from its repos. The first time every agent is done with at least one PR,
 * links sibling PRs in each PR body and moves the ops ticket to In review with the PR link (once).
 */
export const finalizeTicketBuild = async (
  client: CanonicalDataClient,
  build: TicketBuild,
  repos: TicketBuildRepo[],
): Promise<TicketBuild> => {
  const status = computeBuildStatus(build, repos);
  if (!status) return build;
  let next = build;
  if (status !== build.status) next = (await updateTicketBuild(client, build.id, { status })) ?? build;

  if ((status === 'opened' || status === 'partial' || status === 'merged') && !next.ops_synced_at) {
    await linkSiblingPullRequests(repos);
    const prUrl = primaryPrUrl(repos);
    if (prUrl) {
      try {
        await updateOpsTicketPullRequest(build.ops_ticket_id, prUrl);
      } catch (error) {
        console.warn('⚠️ [ticket-builds] Ops write-back failed (will retry on next refresh)', {
          build: build.id,
          error: error instanceof Error ? error.message : error,
        });
        return next;
      }
    }
    next = (await updateTicketBuild(client, build.id, { ops_synced_at: new Date().toISOString() })) ?? next;
    console.log('✅ [ticket-builds] PRs linked and ops ticket updated', { build: build.id, prUrl });
  }
  return next;
};
