import type { SoftwareSystemOpen } from '../../model/software-system-open';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Records that a software system's detail page was opened.
 */
export const createSoftwareSystemOpen = async (
  client: CanonicalDataClient,
  softwareSystemId: string,
): Promise<SoftwareSystemOpen> =>
  invokeCanonicalDataOperation<SoftwareSystemOpen>(client, 'createSoftwareSystemOpen', [softwareSystemId]);
