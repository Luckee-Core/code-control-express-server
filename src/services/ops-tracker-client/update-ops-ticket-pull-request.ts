import type { OpsTicket } from '../../model/ops-ticket';
import { invokeOpsOrThrow } from './invoke-ops-or-throw';

/**
 * Moves an ops ticket to In review with its PR link (skipped when the ticket is already done).
 */
export const updateOpsTicketPullRequest = async (ticketId: string, prUrl: string): Promise<void> => {
  const ticket = await invokeOpsOrThrow<OpsTicket | null>('getTicketById', [ticketId]);
  if (!ticket || ticket.status === 'done') return;
  await invokeOpsOrThrow<unknown>('updateTicket', [{ ticket_id: ticketId, status: 'in_review', github_pr_url: prUrl }]);
};
