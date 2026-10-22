import { Pool } from 'pg';

let managedPool: Pool | null = null;

/**
 * Returns a singleton Postgres pool for parameterized SQL queries.
 *
 * @returns Pool instance, or null if DATABASE_URL is not set
 */
export const getManagedPgPool = (): Pool | null => {
  if (managedPool) return managedPool;

  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    console.warn('⚠️ Postgres pool not configured (set DATABASE_URL)');
    return null;
  }

  managedPool = new Pool({
    connectionString,
    max: Number(process.env.PG_POOL_MAX ?? 10),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });

  managedPool.on('error', (err) => {
    console.error('❌ Postgres pool error:', err);
  });

  return managedPool;
};

/**
 * Initializes the managed Postgres pool at server startup.
 */
export const initializeManagedPgPool = (): void => {
  console.log('🚀 Initializing managed Postgres pool');
  const pool = getManagedPgPool();
  if (pool) {
    console.log('✅ Managed Postgres pool ready');
  } else {
    console.error('❌ Managed Postgres pool not configured');
  }
};
