import { Request, Response } from 'express';
import { runEntityGeneration } from '../../services/code-generation/entities/run-entity-generation';

/**
 * Generate code for an entity using Cursor Cloud Agents API
 *
 * POST /api/project-setup/generate-code
 * Body: { projectId, repoId, entityId, taskId, selectedTaskId }
 */
export const generateCode = async (req: Request, res: Response) => {
  try {
    const { projectId, repoId, entityId, taskId, selectedTaskId } = req.body;

    if (!projectId || !repoId || !entityId || !taskId || !selectedTaskId) {
      res.status(400).json({
        error:
          'projectId, repoId, entityId, taskId, and selectedTaskId are required',
      });
      return;
    }

    const result = await runEntityGeneration({
      projectId,
      repoId,
      entityId,
      taskId,
      selectedTaskId,
    });

    res.json({
      success: true,
      agentId: result.agentId,
      prUrl: result.prUrl,
      summary: result.summary,
      cursorExchangeId: result.cursorExchangeId,
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('❌ Error in generate-code:', err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};
