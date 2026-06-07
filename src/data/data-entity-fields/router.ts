/**
 * Data Entity Fields Router
 */

import { Router, Request, Response } from 'express';
import { getManagedSupabaseClient } from '../../db/supabase-client';
import {
  getDataEntityFieldsByEntityId,
  createDataEntityField,
  updateDataEntityField,
  deleteDataEntityField,
} from './index';

export const createDataEntityFieldsRouter = (): Router => {
  const router = Router();

  router.get('/', async (req: Request, res: Response): Promise<void> => {
    try {
      const entityId = req.query.entity_id as string;
      if (!entityId) {
        res.status(400).json({ success: false, error: 'entity_id query param required' });
        return;
      }
      const supabase = getManagedSupabaseClient();
      const list = await getDataEntityFieldsByEntityId(supabase, entityId);
      res.status(200).json({ success: true, data: list, count: list.length });
    } catch (error) {
      console.error('Error in GET /api/data/data-entity-fields:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  });

  router.post('/', async (req: Request, res: Response): Promise<void> => {
    try {
      const { entity_id, name, type, nullable, default_value, sort_order, references_entity_id } = req.body;
      if (!entity_id || !name || !type) {
        res.status(400).json({
          success: false,
          error: 'entity_id, name, and type are required',
        });
        return;
      }
      const supabase = getManagedSupabaseClient();
      const item = await createDataEntityField(supabase, {
        entity_id,
        name: name.trim(),
        type: type.trim(),
        nullable,
        default_value,
        sort_order,
        references_entity_id,
      });
      res.status(201).json({ success: true, data: item });
    } catch (error) {
      console.error('Error in POST /api/data/data-entity-fields:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  });

  router.patch('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id || Array.isArray(id)) {
        res.status(400).json({ success: false, error: 'Invalid ID' });
        return;
      }
      const { name, type, nullable, default_value, sort_order, references_entity_id } = req.body;
      const supabase = getManagedSupabaseClient();
      const item = await updateDataEntityField(supabase, id, {
        ...(name !== undefined && { name }),
        ...(type !== undefined && { type }),
        ...(nullable !== undefined && { nullable }),
        ...(default_value !== undefined && { default_value }),
        ...(sort_order !== undefined && { sort_order }),
        ...(references_entity_id !== undefined && { references_entity_id }),
      });
      res.status(200).json({ success: true, data: item });
    } catch (error) {
      console.error('Error in PATCH /api/data/data-entity-fields/:id:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  });

  router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id || Array.isArray(id)) {
        res.status(400).json({ success: false, error: 'Invalid ID' });
        return;
      }
      const supabase = getManagedSupabaseClient();
      await deleteDataEntityField(supabase, id);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error in DELETE /api/data/data-entity-fields/:id:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  });

  return router;
};
