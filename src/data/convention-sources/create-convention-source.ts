import type { ConventionSource, CreateConventionSourceInput } from '../../model/convention-source';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Creates a convention source (provenance row). (Storage Express `createConventionSource`)
 */
export const createConventionSource = async (
  client: CanonicalDataClient,
  input: CreateConventionSourceInput
): Promise<ConventionSource> => invokeCanonicalDataOperation<ConventionSource>(client, 'createConventionSource', [input]);
