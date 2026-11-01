import { createSoftwareSystem } from '../../data/software-systems';
import type { CreateSoftwareSystemInput, SoftwareSystem } from '../../model/software-system';
import type { CanonicalDataClient } from '../canonical-data-client';

/**
 * Creates a project for POST /api/data/software-systems.
 */
export const processCreateSoftwareSystem = async (
  client: CanonicalDataClient,
  input: CreateSoftwareSystemInput
): Promise<SoftwareSystem> => createSoftwareSystem(client, input);
