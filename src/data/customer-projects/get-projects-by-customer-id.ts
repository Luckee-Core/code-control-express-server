import type { Project } from '../../model/project';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Loads projects for a customer (oldest first) from Storage Express.
 */
export const getProjectsByCustomerId = async (
  client: CanonicalDataClient,
  customerId: string
): Promise<Project[]> =>
  invokeCanonicalDataOperation<Project[]>(client, 'getProjectsByCustomerId', [customerId]);
