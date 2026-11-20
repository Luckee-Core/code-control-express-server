import type { ConventionChange } from '../../model/convention-change';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Moves still-proposed rows to rejected or superseded (by ids and/or source). (Storage Express invoke)
 */
export const closeProposedConventionChanges = async (
  client: CanonicalDataClient,
  input: { status: 'rejected' | 'superseded'; ids?: string[]; source_type?: string; source_id?: string; reason?: string },
): Promise<ConventionChange[]> =>
  invokeCanonicalDataOperation<ConventionChange[]>(client, 'closeProposedConventionChanges', [input]);
