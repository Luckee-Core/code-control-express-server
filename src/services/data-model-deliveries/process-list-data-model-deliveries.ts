import { listDataModelDeliveriesByProposalId } from '../../data/data-model-deliveries';
import { getDataModelProposalById } from '../../data/data-model-proposals';
import { getSoftwareSystemReposBySoftwareSystemId } from '../../data/software-system-repos';
import type { DataModelDeliveryKind } from '../../model/data-model-delivery';
import type { CanonicalDataClient } from '../canonical-data-client';
import { ProposalRequestError } from '../data-model-proposals/proposal-request-error';
import { deliveryRolesForKind } from './config';
import { resolveRoleRepo } from './resolve-role-repos';
import { syncDeliveryPullRequest } from './sync-delivery-pull-request';
import type { DeliveryTarget } from './types';

/**
 * For each role the kind delivers to (storage, express, web; layout: web): the project's repo for it and the delivery of
 * `kind` already made for this proposal, if any (PR state refreshed from GitHub).
 */
export const processListDataModelDeliveries = async (
  client: CanonicalDataClient,
  proposalId: string,
  kind: DataModelDeliveryKind,
): Promise<DeliveryTarget[]> => {
  const proposal = await getDataModelProposalById(client, proposalId);
  if (!proposal) {
    throw new ProposalRequestError(404, 'Proposal not found');
  }
  const [repos, stored] = await Promise.all([
    getSoftwareSystemReposBySoftwareSystemId(client, proposal.software_system_id),
    listDataModelDeliveriesByProposalId(client, proposalId),
  ]);
  // Pick up PRs merged or closed on GitHub so the panel never offers to re-open them.
  const deliveries = await Promise.all(
    stored.filter((delivery) => (delivery.kind ?? 'model') === kind).map((delivery) => syncDeliveryPullRequest(client, delivery)),
  );
  return deliveryRolesForKind(kind).map((role) => {
    const repo = resolveRoleRepo(repos, role);
    const delivery = deliveries.find((item) => item.role === role && (!repo || item.software_system_repo_id === repo.id)) ?? null;
    return { role, repo, delivery };
  });
};
