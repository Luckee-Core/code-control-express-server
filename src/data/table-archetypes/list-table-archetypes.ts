import type { TableArchetype } from '../../model/table-archetype';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Lists table archetypes. (Storage Express invoke)
 */
export const listTableArchetypes = async (client: CanonicalDataClient): Promise<TableArchetype[]> =>
  invokeCanonicalDataOperation<TableArchetype[]>(client, 'listTableArchetypes', []);
