import type { Request, Response } from 'express';
import type { AgentKind, AgentRunStatus, ListAgentRunsFilter } from '../../../model/agent-run';
import { requireDataClient } from '../../../utils/http/require-data-client';
import { processListAgentRuns } from '../process-agent-run-queries';
import { sendAgentError } from './send-agent-error';

const AGENTS: AgentKind[] = ['pr', 'convention', 'template'];
const STATUSES: AgentRunStatus[] = ['draft', 'running', 'needs_review', 'approved', 'rejected', 'superseded', 'dismissed', 'no_change', 'failed'];

const text = (req: Request, name: string): string | undefined => {
  const value = req.query[name];
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
};

/**
 * Handles GET /api/data/agent-runs?agent=&status=a,b&software_system_id=&delivery_id=&root_run_id=&limit=
 */
export const getAgentRunsHandler = async (req: Request, res: Response): Promise<void> => {
  const client = requireDataClient(res);
  if (!client) return;

  const agent = text(req, 'agent');
  if (agent && !AGENTS.includes(agent as AgentKind)) {
    res.status(400).json({ success: false, error: `agent must be one of ${AGENTS.join(', ')}` });
    return;
  }
  const statuses = (text(req, 'status') ?? '').split(',').map((item) => item.trim()).filter(Boolean);
  const invalid = statuses.filter((status) => !STATUSES.includes(status as AgentRunStatus));
  if (invalid.length > 0) {
    res.status(400).json({ success: false, error: `Unknown status: ${invalid.join(', ')}` });
    return;
  }
  const limit = text(req, 'limit');
  const filter: ListAgentRunsFilter = {
    ...(agent ? { agent: agent as AgentKind } : {}),
    ...(statuses.length > 0 ? { statuses: statuses as AgentRunStatus[] } : {}),
    ...(text(req, 'software_system_id') ? { software_system_id: text(req, 'software_system_id') } : {}),
    ...(text(req, 'delivery_id') ? { delivery_id: text(req, 'delivery_id') } : {}),
    ...(text(req, 'root_run_id') ? { root_run_id: text(req, 'root_run_id') } : {}),
    ...(limit && Number.isInteger(Number(limit)) && Number(limit) > 0 ? { limit: Number(limit) } : {}),
  };
  try {
    res.status(200).json({ success: true, data: await processListAgentRuns(client, filter) });
  } catch (error) {
    sendAgentError(res, 'Error in GET /api/data/agent-runs', error);
  }
};
