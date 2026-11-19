import type { SetupPreset } from '../../model/setup-preset';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Lists project types with their repo role keys via Storage Express.
 */
export const listSetupPresets = async (client: CanonicalDataClient): Promise<SetupPreset[]> =>
  invokeCanonicalDataOperation<SetupPreset[]>(client, 'listSetupPresets', []);
