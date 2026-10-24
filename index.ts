import express from 'express';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: true });

const app = express();
const PORT = Number(process.env.PORT) || 3010;

import { setupEarlyMiddleware } from './src/services/middleware';
setupEarlyMiddleware(app);

import { initializeManagedStorageClient } from './src/services/managed';
import { probeStorage } from './src/services/health/probe-storage';
initializeManagedStorageClient();
void probeStorage();

import { createHealthRouter } from './src/services/health';
app.use('/', createHealthRouter());
app.use('/api/health', createHealthRouter());

import { createCustomersRouter } from './src/services/customers';
import { createProjectSetupRouter } from './src/services/project-setup';
import { createProjectsRouter } from './src/services/projects';
import { createProjectReposRouter } from './src/services/project-repos';
app.use('/api/data/customers', createCustomersRouter());
app.use('/api/data/projects/:id/project-setup', createProjectSetupRouter());
app.use('/api/data/projects', createProjectsRouter());
app.use('/api/data/project-repos', createProjectReposRouter());

import { createTempMigrationRouter } from './src/services/temp-migration';
app.use('/api/admin', createTempMigrationRouter());

import { createStudioSeedRouter } from './src/services/studio-seed';
app.use('/api/studio-seed', createStudioSeedRouter());

import { setupErrorHandling } from './src/services/middleware';
setupErrorHandling(app);

import { startServer } from './src/services/server';
startServer(app, {
  port: PORT,
  environment: process.env.NODE_ENV || 'development',
});

export default app;
