import { requestWithCanonicalDataClient } from './request-canonical-data';
import type { CanonicalDataClient } from './types';

/** Child dispatcher exposes this path; express does not configure it — only this module knows it. */
const INVOKE_PATH = '/api/storage/v1/invoke';

/**
 * Runs a named operation on the canonical data plane (invoke RPC).
 */
export const invokeCanonicalDataOperation = async <T>(
  client: CanonicalDataClient,
  operation: string,
  args: unknown[] = [],
): Promise<T> =>
  requestWithCanonicalDataClient<T>(client, INVOKE_PATH, {
    method: 'POST',
    body: { operation, args },
  });
