/**
 * Get app type template by app type
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type { AppTypeTemplate } from './get-all';

export const getAppTypeTemplate = async (
  supabase: SupabaseClient,
  appType: string
): Promise<{ success: boolean; data?: AppTypeTemplate; error?: string }> => {
  const { data, error } = await supabase
    .from('app_type_templates')
    .select('*')
    .eq('app_type', appType)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return { success: false, error: `No template found for app type: ${appType}` };
    }
    return { success: false, error: error.message };
  }

  return { success: true, data: data as AppTypeTemplate };
};
