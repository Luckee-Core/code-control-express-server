import type { Convention } from '../../model/convention';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Loads one convention (null when missing). (Storage Express invoke)
 */
export const getConventionById = async (
  client: CanonicalDataClient,
  id: string,
): Promise<Convention | null> =>
  invokeCanonicalDataOperation<Convention | null>(client, 'getConventionById', [id]);
