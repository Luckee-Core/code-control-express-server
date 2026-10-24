import type { Project } from '../../model/project';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Loads all customer projects (most recently updated first) from Storage Express.
 */
export const getAllProjects = async (client: CanonicalDataClient): Promise<Project[]> =>
  invokeCanonicalDataOperation<Project[]>(client, 'getAllProjects');
