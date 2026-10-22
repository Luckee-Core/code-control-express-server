/**
 * Applies src/db/migrations/*.sql to DATABASE_URL in filename order.
 *
 * Usage: npm run db:apply-migrations
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: true });

const migrationsDir = path.resolve(__dirname, '../src/db/migrations');

const run = async (): Promise<void> => {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    console.error('❌ DATABASE_URL is required');
    process.exit(1);
  }

  const files = fs
    .readdirSync(migrationsDir)
    .filter((name) => name.endsWith('.sql'))
    .sort();

  if (files.length === 0) {
    console.error('❌ No migration files found');
    process.exit(1);
  }

  const pool = new Pool({ connectionString });

  try {
    for (const file of files) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      console.log(`🚀 Applying ${file}`);
      await pool.query(sql);
      console.log(`✅ Applied ${file}`);
    }
    console.log('✅ All migrations applied');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

void run();
