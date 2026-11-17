/**
 * Setup Early Middleware
 * Configures CORS, body parsing, and other early middleware
 */

import cors from 'cors';
import express, { Express } from 'express';

export const setupEarlyMiddleware = (app: Express): void => {
  // CORS middleware
  app.use(cors());
  
  // JSON body parsing middleware
  app.use(express.json({ limit: '2mb' }));
  
  // URL-encoded body parsing middleware
  app.use(express.urlencoded({ extended: true }));
};
