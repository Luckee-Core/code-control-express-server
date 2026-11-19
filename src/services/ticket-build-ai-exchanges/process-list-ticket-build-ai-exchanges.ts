import { listTicketBuildAiExchanges } from '../../data/ticket-build-ai-exchanges';
import type { TicketBuildAiExchangeSummary } from '../../model/ticket-build-ai-exchange';
import type { CanonicalDataClient } from '../canonical-data-client';

/** Lists a ticket build's AI calls, oldest first (no prompt bodies). */
export const processListTicketBuildAiExchanges = async (
  client: CanonicalDataClient,
  ticketBuildId: string,
): Promise<TicketBuildAiExchangeSummary[]> => listTicketBuildAiExchanges(client, ticketBuildId);
