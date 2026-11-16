import type { Request, Response } from 'express';
import type { ListConventionsFilter } from '../../../model/convention';
import { logHandlerError } from '../../../utils/http/log-handler-error';
import { requireDataClient } from '../../../utils/http/require-data-client';
import { processListConventions } from '../process-list-conventions';
import { readQueryString } from './read-query-string';

/**
 * Handles GET /api/data/conventions.
 */
export const getConventionsHandler = async (req: Request, res: Response): Promise<void> => {
  const client = requireDataClient(res);
  if (!client) return;

  const readStr = (name: string): string | undefined => readQueryString(req, name);
  const filter = {
    ...(readStr('domain_key') && { domain_key: readStr('domain_key') }),
    ...(readStr('topic_key') && { topic_key: readStr('topic_key') }),
    ...(readStr('status') && { status: readStr('status') as ListConventionsFilter['status'] }),
    ...(readStr('severity') && { severity: readStr('severity') as ListConventionsFilter['severity'] }),
    ...(readStr('role_key') && { role_key: readStr('role_key') }),
  };

  try {
    const conventions = await processListConventions(client, filter);
    res.status(200).json({ success: true, data: conventions });
  } catch (error) {
    logHandlerError('Error in GET /api/data/conventions', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};
