import { listAgentRuns } from '../../data/agent-runs';
import { listAiExchanges } from '../../data/ai-exchanges';
import { listDataModelDeliveriesByProposalId } from '../../data/data-model-deliveries';
import { listDataModelProposalAiExchanges } from '../../data/data-model-proposal-ai-exchanges';
import { listDataModelProposalsBySoftwareSystemId } from '../../data/data-model-proposals';
import { listTicketBuildAiExchanges } from '../../data/ticket-build-ai-exchanges';
import { listTicketBuildsBySoftwareSystemId } from '../../data/ticket-builds';
import type { AgentKind } from '../../model/agent-run';
import type { AiCostCall, AiCostSource } from '../../model/ai-cost-call';
import type { CanonicalDataClient } from '../canonical-data-client';

const AGENT_SOURCE: Record<AgentKind, AiCostSource> = {
  pr: 'pr_agent',
  convention: 'convention_agent',
  template: 'template_agent',
};

/**
 * Every AI call made for a software system, newest first: data-model proposal calls, ticket build
 * calls and agent run calls (PR, convention and template runs carry the system id). Agent run
 * calls carry their delivery's kind (model → Data model tab, crud → API tab).
 */
export const processListSoftwareSystemAiCalls = async (
  client: CanonicalDataClient,
  softwareSystemId: string,
): Promise<AiCostCall[]> => {
  const [proposals, builds, runs] = await Promise.all([
    listDataModelProposalsBySoftwareSystemId(client, softwareSystemId),
    listTicketBuildsBySoftwareSystemId(client, softwareSystemId),
    listAgentRuns(client, { software_system_id: softwareSystemId, limit: 1000 }),
  ]);

  // Delivery id → kind, so agent run calls can be split between the Data model and API tabs.
  const deliveryKinds = new Map(
    (await Promise.all(proposals.map((proposal) => listDataModelDeliveriesByProposalId(client, proposal.id))))
      .flat()
      .map((delivery) => [delivery.id, delivery.kind] as const),
  );

  const [proposalCalls, buildCalls, runCalls] = await Promise.all([
    Promise.all(
      proposals.map(async (proposal) =>
        (await listDataModelProposalAiExchanges(client, proposal.id)).map(
          (exchange): AiCostCall => ({
            id: exchange.exchange_id,
            source: 'data_model',
            source_id: proposal.id,
            source_label: `Data model v${proposal.version}`,
            delivery_id: null,
            delivery_kind: null,
            purpose: exchange.purpose,
            model: exchange.model,
            served_by_model: exchange.served_by_model,
            status: exchange.status,
            stop_reason: exchange.stop_reason,
            input_tokens: exchange.input_tokens,
            output_tokens: exchange.output_tokens,
            duration_ms: exchange.duration_ms,
            error: exchange.error,
            created_at: exchange.created_at,
          }),
        ),
      ),
    ),
    Promise.all(
      builds.map(async (build) =>
        (await listTicketBuildAiExchanges(client, build.id)).map(
          (exchange): AiCostCall => ({
            id: exchange.exchange_id,
            source: 'ticket_build',
            source_id: build.id,
            source_label: build.ops_ticket_title,
            delivery_id: null,
            delivery_kind: null,
            purpose: exchange.purpose,
            model: exchange.model,
            served_by_model: exchange.served_by_model,
            status: exchange.status,
            stop_reason: exchange.stop_reason,
            input_tokens: exchange.input_tokens,
            output_tokens: exchange.output_tokens,
            duration_ms: exchange.duration_ms,
            error: exchange.error,
            created_at: exchange.created_at,
          }),
        ),
      ),
    ),
    Promise.all(
      runs.map(async (run) =>
        (await listAiExchanges(client, run.id)).map(
          (exchange): AiCostCall => ({
            id: exchange.id,
            source: AGENT_SOURCE[run.agent],
            source_id: run.id,
            source_label: run.title,
            delivery_id: run.delivery_id,
            delivery_kind: run.delivery_id ? deliveryKinds.get(run.delivery_id) ?? null : null,
            purpose: exchange.purpose,
            model: exchange.model,
            served_by_model: exchange.served_by_model,
            status: exchange.status,
            stop_reason: exchange.stop_reason,
            input_tokens: exchange.input_tokens,
            output_tokens: exchange.output_tokens,
            duration_ms: exchange.duration_ms,
            error: exchange.error,
            created_at: exchange.created_at,
          }),
        ),
      ),
    ),
  ]);

  return [...proposalCalls.flat(), ...buildCalls.flat(), ...runCalls.flat()].sort((a, b) =>
    b.created_at.localeCompare(a.created_at),
  );
};
