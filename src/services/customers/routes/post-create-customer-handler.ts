import type { Request, Response } from 'express';
import type { CustomerStage } from '../../../model/customer';
import { requireStorageClient } from '../../../utils/http/require-storage-client';
import { processCreateCustomer } from '../process-create-customer';

const CUSTOMER_STAGES: CustomerStage[] = ['discovery_call', 'active', 'inactive'];

/**
 * Handles POST /api/data/customers.
 */
export const postCreateCustomerHandler = async (req: Request, res: Response): Promise<void> => {
  const storage = requireStorageClient(res);
  if (!storage) return;

  const { name, description, stage } = req.body ?? {};
  if (!name || typeof name !== 'string' || !name.trim()) {
    res.status(400).json({ success: false, error: 'name is required' });
    return;
  }

  console.log('📥 POST /api/data/customers');
  try {
    const customer = await processCreateCustomer(storage, {
      name: name.trim(),
      description: typeof description === 'string' ? description.trim() : null,
      stage: CUSTOMER_STAGES.includes(stage) ? stage : undefined,
    });
    console.log('✅ Customer created:', customer.id);
    res.status(201).json({ success: true, data: customer });
  } catch (error) {
    console.error('❌ Error in POST /api/data/customers:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};
