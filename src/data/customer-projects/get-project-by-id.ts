import type { Project } from '../../model/project';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Loads one project by primary key from Storage Express.
 */
export const getProjectById = async (
  client: CanonicalDataClient,
  id: string
): Promise<Project | null> =>
  invokeCanonicalDataOperation<Project | null>(client, 'getProjectById', [id]);
