import type { ConventionChange, ProposedConventionChangeInput } from '../../model/convention-change';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Records AI-proposed changes as proposed ledger rows. (Storage Express invoke)
 */
export const recordProposedConventionChanges = async (
  client: CanonicalDataClient,
  changes: ProposedConventionChangeInput[],
): Promise<ConventionChange[]> =>
  invokeCanonicalDataOperation<ConventionChange[]>(client, 'recordProposedConventionChanges', [changes]);
