import { listConventionChanges } from '../../data/convention-changes';
import { listConventionChangePropagations } from '../../data/convention-change-propagations';
import type { AgentRun, ConventionChangePropagation } from '../../model/agent-run';
import type { ConventionChange } from '../../model/convention-change';
import type { CanonicalDataClient } from '../canonical-data-client';

/**
 * A template run's propagation rows (every status, so skipped / denied ones stay visible) and the
 * convention changes they point at.
 */
export const loadTemplateCarriedChanges = async (
  client: CanonicalDataClient,
  run: AgentRun,
): Promise<{ changes: ConventionChange[]; propagations: ConventionChangePropagation[] }> => {
  const propagations = await listConventionChangePropagations(client, { run_id: run.id });
  const ids = [...new Set([...propagations.map((row) => row.convention_change_id), ...((run.input.change_ids as string[] | undefined) ?? [])])];
  const changes = ids.length > 0 ? await listConventionChanges(client, { ids, limit: 1000 }) : [];
  return { changes, propagations };
};
