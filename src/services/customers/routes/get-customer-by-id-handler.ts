import type { Request, Response } from 'express';
import { logHandlerError } from '../../../utils/http/log-handler-error';
import { requireDataClient } from '../../../utils/http/require-data-client';
import { processGetCustomer } from '../process-get-customer';

/**
 * Handles GET /api/data/customers/:id.
 */
export const getCustomerByIdHandler = async (req: Request, res: Response): Promise<void> => {
  const client = requireDataClient(res);
  if (!client) return;

  const { id } = req.params;
  if (!id || Array.isArray(id)) {
    res.status(400).json({ success: false, error: 'Invalid customer ID' });
    return;
  }

  try {
    const customer = await processGetCustomer(client, id);
    if (!customer) {
      res.status(404).json({ success: false, error: 'Customer not found' });
      return;
    }
    res.status(200).json({ success: true, data: customer });
  } catch (error) {
    logHandlerError('Error in GET /api/data/customers/:id', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};
