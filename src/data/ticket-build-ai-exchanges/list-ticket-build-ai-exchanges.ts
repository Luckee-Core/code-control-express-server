import type { TicketBuildAiExchangeSummary } from '../../model/ticket-build-ai-exchange';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Lists a ticket build's AI calls, oldest first.
 */
export const listTicketBuildAiExchanges = async (
  client: CanonicalDataClient,
  ticketBuildId: string,
): Promise<TicketBuildAiExchangeSummary[]> => invokeCanonicalDataOperation<TicketBuildAiExchangeSummary[]>(client, 'listTicketBuildAiExchanges', [ticketBuildId]);
