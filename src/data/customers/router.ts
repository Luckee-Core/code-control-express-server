/**
 * Read-only customers router for Code Control project list
 */

import { Router, Request, Response } from 'express';
import { getManagedSupabaseClient } from '../../db/supabase-client';
import { getAllCustomers, getCustomerById } from './index';

export const createCustomersRouter = (): Router => {
  const router = Router();

  router.get('/', async (req: Request, res: Response): Promise<void> => {
    try {
      const supabase = getManagedSupabaseClient();
      if (!supabase) {
        res.status(500).json({ success: false, error: 'Service unavailable' });
        return;
      }
      const params = {
        stage: req.query.stage as string | undefined,
      };
      const customers = await getAllCustomers(supabase, params);
      res.status(200).json({
        success: true,
        data: customers,
        count: customers.length,
      });
    } catch (error) {
      console.error('❌ Error in GET /api/data/customers:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  });

  router.get('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id || Array.isArray(id)) {
        res.status(400).json({ success: false, error: 'Invalid customer ID' });
        return;
      }
      const supabase = getManagedSupabaseClient();
      if (!supabase) {
        res.status(500).json({ success: false, error: 'Service unavailable' });
        return;
      }
      const customer = await getCustomerById(supabase, id);
      if (!customer) {
        res.status(404).json({ success: false, error: 'Customer not found' });
        return;
      }
      res.status(200).json({ success: true, data: customer });
    } catch (error) {
      console.error('❌ Error in GET /api/data/customers/:id:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  });

  return router;
};
