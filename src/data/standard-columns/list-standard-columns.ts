import type { StandardColumn } from '../../model/standard-column';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Lists the standard columns. (Storage Express invoke)
 */
export const listStandardColumns = async (client: CanonicalDataClient): Promise<StandardColumn[]> =>
  invokeCanonicalDataOperation<StandardColumn[]>(client, 'listStandardColumns', []);
