/**
 * Code Control Admin API Router
 * All authenticated data endpoints under /api/data
 */

import { Router } from 'express';
import { createWorkspacesRouter } from '../workspaces/router';
import { createProjectsRouter } from '../projects/router';
import { createProjectReposRouter } from '../project-repos/router';
import { createProjectSetupRouter } from '../project-setup/router';
import { createBuildConventionsRouter } from '../build-conventions/router';
import { createBuildExamplesRouter } from '../build-examples/router';
import { createDataEntitiesRouter } from '../data-entities/router';
import { createDataEntityFieldsRouter } from '../data-entity-fields/router';
import { createDataEntityOperationsRouter } from '../data-entity-operations/router';
import { createDataEntityGenerationTasksRouter } from '../data-entity-generation-tasks/router';
import { createDataEntitySelectedTasksRouter } from '../data-entity-selected-tasks/router';
import { createCursorGenerationRouter } from '../cursor-generation/router';
import { createCodeGenerationQueueRouter } from '../code-generation-queue/router';
import { createAppTypeTemplatesRouter } from '../app-type-templates/router';
import { createARDTasksRouter } from '../ard-tasks/router';
import { createARDGenerationQueueRouter } from '../ard-generation-queue/router';
import { createDataModelGenerationQueueRouter } from '../data-model-generation-queue/router';
import { createCrudApiTasksRouter } from '../crud-api-tasks/router';
import { createCrudApiGenerationQueueRouter } from '../crud-api-generation-queue/router';
import { createBuildStepsRouter } from '../build-steps/router';
import { createTaskCategoriesRouter } from '../task-categories/router';
import { createStepTaskCategoriesRouter } from '../step-task-categories/router';
import { createConventionTaskCategoriesRouter } from '../convention-task-categories/router';

/**
 * Creates the unified Code Control admin router.
 */
export const createAdminRouter = (): Router => {
  const router = Router();

  router.use('/workspaces', createWorkspacesRouter());
  router.use('/projects/:id/project-setup', createProjectSetupRouter());
  router.use('/projects', createProjectsRouter());
  router.use('/project-repos', createProjectReposRouter());
  router.use('/build-conventions', createBuildConventionsRouter());
  router.use('/build-examples', createBuildExamplesRouter());
  router.use('/data-entities', createDataEntitiesRouter());
  router.use('/data-entity-fields', createDataEntityFieldsRouter());
  router.use('/data-entity-operations', createDataEntityOperationsRouter());
  router.use('/data-entity-generation-tasks', createDataEntityGenerationTasksRouter());
  router.use('/data-entity-selected-tasks', createDataEntitySelectedTasksRouter());
  router.use('/cursor-generation', createCursorGenerationRouter());
  router.use('/code-generation-queue', createCodeGenerationQueueRouter());
  router.use('/app-type-templates', createAppTypeTemplatesRouter());
  router.use('/ard-tasks', createARDTasksRouter());
  router.use('/ard-generation-queue', createARDGenerationQueueRouter());
  router.use('/data-model-generation-queue', createDataModelGenerationQueueRouter());
  router.use('/crud-api-tasks', createCrudApiTasksRouter());
  router.use('/crud-api-generation-queue', createCrudApiGenerationQueueRouter());
  router.use('/build-steps', createBuildStepsRouter());
  router.use('/task-categories', createTaskCategoriesRouter());
  router.use('/step-task-categories', createStepTaskCategoriesRouter());
  router.use('/convention-task-categories', createConventionTaskCategoriesRouter());

  return router;
};
