import type { Request, Response } from 'express';
import { logHandlerError } from '../../../utils/http/log-handler-error';
import { requireDataClient } from '../../../utils/http/require-data-client';
import { resolveDispatcherPlan } from '../../data-model-deliveries/resolve-dispatcher-plan';

/**
 * Handles GET /api/data/software-systems/:id/dispatcher-plan: the project dispatcher plan (ids,
 * ports, repos, spawn folders, secret names, exposed endpoints and what still blocks delivery).
 */
export const getSoftwareSystemDispatcherPlanHandler = async (req: Request, res: Response): Promise<void> => {
  const client = requireDataClient(res);
  if (!client) return;
  const { id } = req.params;
  if (!id || Array.isArray(id)) {
    res.status(400).json({ success: false, error: 'Invalid software system ID' });
    return;
  }
  console.log('📥 GET /api/data/software-systems/:id/dispatcher-plan', { id });
  try {
    const plan = await resolveDispatcherPlan(client, id);
    res.status(200).json({ success: true, data: plan });
  } catch (error) {
    logHandlerError('Error in GET /api/data/software-systems/:id/dispatcher-plan', error);
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(message === 'Software system not found' ? 404 : 500).json({ success: false, error: message });
  }
};
