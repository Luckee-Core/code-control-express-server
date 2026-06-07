/**
 * Get all app type templates
 */

import { SupabaseClient } from '@supabase/supabase-js';

export type BuildPhase = {
  id: string;
  name: string;
  description?: string;
  order: number;
  tasks: string[];
  depends_on?: string[];
};

export type AppTypeTemplate = {
  id: string;
  app_type: string;
  name: string;
  description: string | null;
  entity_templates: unknown | null;
  platform_config: unknown | null;
  build_phases: {
    mobile?: BuildPhase[];
    express?: BuildPhase[];
    web?: BuildPhase[];
  };
  created_at: string;
  updated_at: string;
};

export const getAllAppTypeTemplates = async (
  supabase: SupabaseClient
): Promise<AppTypeTemplate[]> => {
  const { data, error } = await supabase
    .from('app_type_templates')
    .select('*')
    .order('app_type', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch app type templates: ${error.message}`);
  }

  return (data || []) as AppTypeTemplate[];
};
