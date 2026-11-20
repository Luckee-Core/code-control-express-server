import type { ConventionChange, UpdateProposedConventionChangeInput } from '../../model/convention-change';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Edits a proposed ledger row before it is applied; null when no longer proposed. (Storage Express invoke)
 */
export const updateProposedConventionChange = async (
  client: CanonicalDataClient,
  id: string,
  input: UpdateProposedConventionChangeInput,
): Promise<ConventionChange | null> =>
  invokeCanonicalDataOperation<ConventionChange | null>(client, 'updateProposedConventionChange', [id, input]);
