import type { Request, Response } from 'express';
import type { ListConventionChangesFilter } from '../../../model/convention-change';
import { readRouteParam } from '../../../utils/http/read-route-param';
import { requireDataClient } from '../../../utils/http/require-data-client';
import { sendHandlerError } from '../../../utils/http/send-handler-error';
import { processListConventionChanges } from '../process-list-convention-changes';
import { readQueryString } from './read-query-string';

const STRING_FILTERS = [
  'convention_key',
  'domain_key',
  'role_key',
  'change_type',
  'source_type',
  'source_id',
  'status',
] as const;

/**
 * Handles GET /api/data/conventions/changes and GET /api/data/conventions/:id/changes
 * (ledger rows, newest first; optional filters plus `since` (ISO) and `limit`).
 */
export const getConventionChangesHandler = async (req: Request, res: Response): Promise<void> => {
  const client = requireDataClient(res);
  if (!client) return;

  const filter: Record<string, unknown> = {};
  for (const name of STRING_FILTERS) {
    const value = readQueryString(req, name);
    if (value) filter[name] = value;
  }
  const conventionId = readRouteParam(req, 'id');
  if (conventionId) filter.convention_id = conventionId;

  const since = readQueryString(req, 'since');
  if (since) {
    if (Number.isNaN(Date.parse(since))) {
      res.status(400).json({ success: false, error: 'since must be an ISO date' });
      return;
    }
    filter.since = since;
  }
  const limit = readQueryString(req, 'limit');
  if (limit) {
    const parsed = Number(limit);
    if (!Number.isInteger(parsed) || parsed < 1) {
      res.status(400).json({ success: false, error: 'limit must be a positive integer' });
      return;
    }
    filter.limit = parsed;
  }

  try {
    const changes = await processListConventionChanges(client, filter as ListConventionChangesFilter);
    res.status(200).json({ success: true, data: changes });
  } catch (error) {
    sendHandlerError(res, 'Error in GET /api/data/conventions/changes', error);
  }
};
