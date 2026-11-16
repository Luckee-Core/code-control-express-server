import { createConventionSource } from '../../data/convention-sources';
import type { ConventionSource, CreateConventionSourceInput } from '../../model/convention-source';
import type { CanonicalDataClient } from '../canonical-data-client';

/**
 * Creates a source for POST /api/data/conventions/:id/sources.
 */
export const processCreateConventionSource = async (
  client: CanonicalDataClient,
  input: CreateConventionSourceInput
): Promise<ConventionSource> => createConventionSource(client, input);
