import { listTicketBuildReposByBuildId } from '../../data/ticket-build-repos';
import { getTicketBuildById } from '../../data/ticket-builds';
import type { TicketBuild } from '../../model/ticket-build';
import type { CanonicalDataClient } from '../canonical-data-client';
import { finalizeTicketBuild } from './finalize-ticket-build';
import { settleStaleTicketBuild } from './settle-stale-ticket-build';
import { syncTicketBuildRepo } from './sync-ticket-build-repo';
import { TicketBuildRequestError } from './ticket-build-request-error';

const SYNC_STATUSES = ['building', 'opened', 'partial', 'merged'];

/**
 * Loads a build for display (the polling target): settles an interrupted plan, syncs running agents
 * and opened PRs, then finalizes the build status (sibling PR links + ops write-back, once).
 */
export const processGetTicketBuild = async (client: CanonicalDataClient, id: string): Promise<TicketBuild> => {
  const found = await getTicketBuildById(client, id);
  if (!found) throw new TicketBuildRequestError(404, 'Ticket build not found');
  const build = await settleStaleTicketBuild(client, found);
  if (!SYNC_STATUSES.includes(build.status)) return build;
  const repos = await listTicketBuildReposByBuildId(client, build.id);
  const synced = await Promise.all(repos.map((repo) => syncTicketBuildRepo(client, repo)));
  return finalizeTicketBuild(client, build, synced);
};
