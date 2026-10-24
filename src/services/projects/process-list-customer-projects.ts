import { getProjectsByCustomerId } from '../../data/customer-projects';
import type { Project } from '../../model/project';
import type { CanonicalDataClient } from '../canonical-data-client';

/**
 * Lists one customer's projects for GET /api/data/projects/customer/:customerId.
 */
export const processListCustomerProjects = async (
  client: CanonicalDataClient,
  customerId: string
): Promise<Project[]> => getProjectsByCustomerId(client, customerId);
