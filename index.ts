import express from 'express';
import dotenv from 'dotenv';
import path from 'path';

const projectRoot = path.resolve(__dirname);
dotenv.config({ path: path.join(projectRoot, '.env') });
dotenv.config({ path: path.join(projectRoot, '.env.local'), override: true });

const app = express();
const PORT = Number(process.env.PORT) || 3010;

import { setupEarlyMiddleware } from './src/services/middleware';
setupEarlyMiddleware(app);

import { initializeManagedCanonicalDataClient } from './src/services/managed';
import { probeCanonicalData } from './src/services/health/probe-canonical-data';
import { initializeOpsTrackerGatewayClient } from './src/services/ops-tracker-client';
initializeManagedCanonicalDataClient();
initializeOpsTrackerGatewayClient();
void probeCanonicalData();

import { createHealthRouter } from './src/services/health';
app.use('/', createHealthRouter());
app.use('/api/health', createHealthRouter());

import { createCrmProxyRouter } from './src/services/crm-proxy';
import { createSoftwareSystemSetupRouter } from './src/services/software-system-setup';
import { createSoftwareSystemsRouter } from './src/services/software-systems';
import { createSoftwareSystemReposRouter } from './src/services/software-system-repos';
import { createConventionsRouter } from './src/services/conventions';
import { createDataModelProposalsRouter } from './src/services/data-model-proposals';
import { createDataModelDeliveriesRouter } from './src/services/data-model-deliveries';
import { createSetupPresetsRouter } from './src/services/setup-presets';
import { createTicketBuildsRouter } from './src/services/ticket-builds';
import { createTicketBuildReposRouter } from './src/services/ticket-build-repos';
import { createTicketBuildAiExchangesRouter } from './src/services/ticket-build-ai-exchanges';
import { createAgentRunsRouter, startAgentWorker } from './src/services/agent-runs';
app.use('/api/crm', createCrmProxyRouter());
app.use('/api/data/conventions', createConventionsRouter());
app.use('/api/data/data-model-proposals', createDataModelProposalsRouter());
app.use('/api/data/data-model-deliveries', createDataModelDeliveriesRouter());
app.use('/api/data/setup-presets', createSetupPresetsRouter());
app.use('/api/data/ticket-builds', createTicketBuildsRouter());
app.use('/api/data/ticket-build-repos', createTicketBuildReposRouter());
app.use('/api/data/ticket-build-ai-exchanges', createTicketBuildAiExchangesRouter());
app.use('/api/data/agent-runs', createAgentRunsRouter());
startAgentWorker();
app.use('/api/data/software-systems/:id/software-system-setup', createSoftwareSystemSetupRouter());
app.use('/api/data/software-systems', createSoftwareSystemsRouter());
app.use('/api/data/software-system-repos', createSoftwareSystemReposRouter());

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
