import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let managedClient: SupabaseClient | null = null;

/**
 * Returns the managed Supabase client, initializing lazily if needed.
 * @throws When Supabase env vars are missing
 */
export const getManagedSupabaseClient = (): SupabaseClient => {
  if (managedClient) return managedClient;

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }

  managedClient = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  return managedClient;
};

/**
 * Initializes the managed Supabase client at server startup.
 */
export const initializeManagedSupabaseClient = (): void => {
  console.log('🚀 Initializing managed Supabase client');
  try {
    getManagedSupabaseClient();
    console.log('✅ Managed Supabase client ready');
  } catch {
    console.error('❌ Managed Supabase client not configured');
  }
};
