import type { OpsTicket } from '../../model/ops-ticket';
import { invokeOpsOrThrow } from './invoke-ops-or-throw';

/** One My Ops Tracker ticket; null when it doesn't exist. */
export const getOpsTicket = async (ticketId: string): Promise<OpsTicket | null> =>
  invokeOpsOrThrow<OpsTicket | null>('getTicketById', [ticketId]);
