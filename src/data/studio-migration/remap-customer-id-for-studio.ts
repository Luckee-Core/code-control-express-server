import { invokeCanonicalDataOperation } from '../../services/canonical-data-client/invoke-canonical-data-operation';
import type { CanonicalDataClient } from '../../services/canonical-data-client/types';

export type RemapCustomerIdForStudioResult = {
  projectsUpdated: number;
  reposUpdated: number;
};

/**
 * Remaps legacy local customer id to Ops CRM id via Storage Express.
 */
export const remapCustomerIdForStudio = async (
  client: CanonicalDataClient,
  oldCustomerId: string,
  newCustomerId: string,
): Promise<RemapCustomerIdForStudioResult> =>
  invokeCanonicalDataOperation<RemapCustomerIdForStudioResult>(
    client,
    'remapCustomerIdForStudio',
    [oldCustomerId, newCustomerId],
  );
