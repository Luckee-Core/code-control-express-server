import type { LifecycleOption } from '../../model/lifecycle-option';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Lists lifecycle options. (Storage Express invoke)
 */
export const listLifecycleOptions = async (client: CanonicalDataClient): Promise<LifecycleOption[]> =>
  invokeCanonicalDataOperation<LifecycleOption[]>(client, 'listLifecycleOptions', []);
