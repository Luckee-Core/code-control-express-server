import { getProjectsByCustomerId } from '../../data/customer-projects';
import type { Project } from '../../model/project';
import type { StorageClient } from '../storage-client';

/**
 * Lists one customer's projects for GET /api/data/projects/customer/:customerId.
 */
export const processListCustomerProjects = async (
  storage: StorageClient,
  customerId: string
): Promise<Project[]> => getProjectsByCustomerId(storage, customerId);
