import type { Convention } from '../../model/convention';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Returns one convention by id, or null. (Storage Express `getConventionById`)
 */
export const getConventionById = async (
  client: CanonicalDataClient,
  id: string
): Promise<Convention | null> => invokeCanonicalDataOperation<Convention | null>(client, 'getConventionById', [id]);
