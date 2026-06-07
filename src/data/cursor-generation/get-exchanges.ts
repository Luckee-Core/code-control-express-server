import { getManagedSupabaseClient } from '../../db/supabase-client';

export type CursorGenerationExchange = {
  id: string;
  user_id: string | null;
  request_id: string;
  response_id: string | null;
  agent_id: string;
  model_used: string | null;
  api_calls_count: number;
  duration_seconds: number | null;
  cost_estimate: number | null;
  repository: string;
  branch_ref: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  error_message: string | null;
  created_at: string;
  updated_at: string;
};

/**
 * Get cursor generation exchanges by request ID
 *
 * @param requestId - Request ID
 * @returns Array of cursor generation exchanges
 */
export const getCursorGenerationExchangesByRequest = async (
  requestId: string
): Promise<CursorGenerationExchange[]> => {
  const supabase = getManagedSupabaseClient();

  const { data, error } = await supabase
    .from('cursor_generation_exchanges')
    .select('*')
    .eq('request_id', requestId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching cursor generation exchanges:', error);
    throw new Error(`Failed to fetch cursor generation exchanges: ${error.message}`);
  }

  return data || [];
};

/**
 * Get a single cursor generation exchange by ID
 *
 * @param exchangeId - Exchange ID
 * @returns Exchange or null
 */
export const getCursorGenerationExchangeById = async (
  exchangeId: string
): Promise<CursorGenerationExchange | null> => {
  const supabase = getManagedSupabaseClient();

  const { data, error } = await supabase
    .from('cursor_generation_exchanges')
    .select('*')
    .eq('id', exchangeId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('❌ Error fetching cursor generation exchange:', error);
    throw new Error(`Failed to fetch cursor generation exchange: ${error.message}`);
  }

  return data;
};
