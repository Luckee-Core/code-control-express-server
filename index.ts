import express from 'express';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: true });

const app = express();
const PORT = Number(process.env.PORT) || 3010;

import { setupEarlyMiddleware } from './src/services/middleware';
setupEarlyMiddleware(app);

import { initializeManagedSupabaseClient } from './src/services/managed';
initializeManagedSupabaseClient();

import { createHealthRouter } from './src/services/health';
app.use('/', createHealthRouter());
app.use('/api/health', createHealthRouter());

import { createAdminRouter } from './src/data/admin';
app.use('/api/data', createAdminRouter());

import { setupErrorHandling } from './src/services/middleware';
setupErrorHandling(app);

import { startServer } from './src/services/server';
startServer(app, {
  port: PORT,
  environment: process.env.NODE_ENV || 'development',
});

export default app;
