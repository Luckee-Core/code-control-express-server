import { Router } from 'express';
import { deleteDataModelProposalHandler } from './routes/delete-data-model-proposal-handler';
import { getDataModelProposalHandler } from './routes/get-data-model-proposal-handler';
import { getDataModelProposalsHandler } from './routes/get-data-model-proposals-handler';
import { postApproveDataModelProposalHandler } from './routes/post-approve-data-model-proposal-handler';
import { postCreateDataModelProposalHandler } from './routes/post-create-data-model-proposal-handler';
import { postReviseDataModelProposalHandler } from './routes/post-revise-data-model-proposal-handler';

/**
 * Creates the data-model proposals router (mounted at /api/data/data-model-proposals).
 */
export const createDataModelProposalsRouter = (): Router => {
  const router = Router();
  router.get('/', getDataModelProposalsHandler);
  router.post('/', postCreateDataModelProposalHandler);
  router.get('/:id', getDataModelProposalHandler);
  router.post('/:id/revise', postReviseDataModelProposalHandler);
  router.post('/:id/approve', postApproveDataModelProposalHandler);
  router.delete('/:id', deleteDataModelProposalHandler);
  return router;
};
