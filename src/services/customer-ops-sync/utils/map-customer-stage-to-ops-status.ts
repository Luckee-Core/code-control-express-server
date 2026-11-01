import type { CustomerStage } from '../../../model/customer';
import type { OpsCustomerStatus } from '../types';

/**
 * Maps legacy Code Control customer stage to Ops CRM status on create.
 */
export const mapCustomerStageToOpsStatus = (stage: CustomerStage): OpsCustomerStatus => {
  switch (stage) {
    case 'discovery_call':
      return 'pending_review';
    case 'active':
      return 'active';
    case 'inactive':
      return 'inactive';
    default: {
      const _exhaustive: never = stage;
      return _exhaustive;
    }
  }
};
