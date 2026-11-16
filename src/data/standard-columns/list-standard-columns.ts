import type { StandardColumn } from '../../model/standard-column';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Lists standard columns every table gets. (Storage Express `listStandardColumns`)
 */
export const listStandardColumns = async (
  client: CanonicalDataClient
): Promise<StandardColumn[]> => invokeCanonicalDataOperation<StandardColumn[]>(client, 'listStandardColumns', []);
