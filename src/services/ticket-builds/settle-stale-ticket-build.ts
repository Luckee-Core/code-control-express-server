import { updateTicketBuild } from '../../data/ticket-builds';
import type { TicketBuild } from '../../model/ticket-build';
import type { CanonicalDataClient } from '../canonical-data-client';
import { STALE_PLANNING_MS } from './config';
import { activeTicketBuildPlans } from './run-ticket-build-plan';

/**
 * Marks a build plan_failed when it has been `planning` too long with no live job in this process
 * (Express restarted mid-plan). Returns the build as it should be shown.
 */
export const settleStaleTicketBuild = async (client: CanonicalDataClient, build: TicketBuild): Promise<TicketBuild> => {
  if (build.status !== 'planning' || activeTicketBuildPlans.has(build.id)) return build;
  if (Date.now() - new Date(build.updated_at).getTime() < STALE_PLANNING_MS) return build;
  console.warn('⚠️ [ticket-builds] Marking interrupted plan failed', { build: build.id });
  return (
    (await updateTicketBuild(client, build.id, {
      status: 'plan_failed',
      error: 'Planning was interrupted (the API restarted). Revise to plan again.',
    })) ?? build
  );
};
