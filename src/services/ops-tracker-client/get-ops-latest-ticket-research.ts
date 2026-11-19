import type { OpsTicketResearch } from '../../model/ops-ticket';
import { invokeOpsOrThrow } from './invoke-ops-or-throw';

type OpsResearchRun = { id: string; status: string; summary: string | null };
type OpsResearchPart = { layer: string; title: string; description: string; candidates: string[] };

/**
 * The ticket's newest completed ops Research (summary + parts), or null. Never throws:
 * research is optional planning input.
 */
export const getOpsLatestTicketResearch = async (ticketId: string): Promise<OpsTicketResearch | null> => {
  try {
    const runs = await invokeOpsOrThrow<OpsResearchRun[]>('getTicketResearchRunsByTicketId', [ticketId]);
    const run = runs.find((row) => row.status === 'completed');
    if (!run) return null;
    const parts = await invokeOpsOrThrow<OpsResearchPart[]>('getTicketResearchPartsByRunId', [run.id]);
    return { summary: run.summary, parts };
  } catch (error) {
    console.warn('⚠️ [ops-tracker-client] Ticket research unavailable', {
      ticketId,
      error: error instanceof Error ? error.message : error,
    });
    return null;
  }
};
