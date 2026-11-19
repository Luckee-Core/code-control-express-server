import { describeOpsTrackerGatewayConfigGap, readOpsTrackerGatewayConfig } from './config';
import { requestOpsTrackerInvoke } from './request-ops-tracker-invoke';

/**
 * Calls a My Ops Tracker storage operation through the gateway; throws on any failure.
 * Used by ticket builds, where a missing ops answer should stop the step.
 */
export const invokeOpsOrThrow = async <T>(operation: string, args: unknown[]): Promise<T> => {
  const config = readOpsTrackerGatewayConfig();
  if (!config) throw new Error(describeOpsTrackerGatewayConfigGap() ?? 'Ops-tracker gateway not configured');
  const result = await requestOpsTrackerInvoke<T>(config, operation, args);
  if (!result.success) throw new Error(`Ops ${operation} failed: ${result.error}`);
  return result.data;
};
