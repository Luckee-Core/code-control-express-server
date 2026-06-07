/**
 * Update customer project repo phase
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { ProjectRepo } from './types';

export type UpdateRepoPhaseInput = {
  current_phase?: string | null;
  phase_status?: string | null;
};

export const updateProjectRepoPhase = async (
  supabase: SupabaseClient,
  repoId: string,
  input: UpdateRepoPhaseInput
): Promise<ProjectRepo> => {
  const updateData: Record<string, unknown> = {};
  if (input.current_phase !== undefined) updateData.current_phase = input.current_phase;
  if (input.phase_status !== undefined) updateData.phase_status = input.phase_status;

  const { data, error } = await supabase
    .from('project_repos')
    .update(updateData)
    .eq('id', repoId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update customer project repo: ${error.message}`);
  }

  return data as ProjectRepo;
};
