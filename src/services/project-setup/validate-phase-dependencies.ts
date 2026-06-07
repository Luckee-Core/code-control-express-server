/**
 * Validate phase dependencies - check if user can advance to a target phase
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { getAppTypeTemplate } from '../../data/app-type-templates';

type BuildPhase = {
  id: string;
  name: string;
  tasks?: string[];
  depends_on?: string[];
};

const getPhasesForRepoType = (
  buildPhases:
    | { mobile?: BuildPhase[]; express?: BuildPhase[]; nextjs?: BuildPhase[] }
    | undefined,
  repoType: string
): BuildPhase[] => {
  if (!buildPhases) return [];
  const phases = (buildPhases as Record<string, BuildPhase[] | undefined>)[repoType];
  return Array.isArray(phases) ? phases : [];
};

export const canProgressToPhase = async (
  supabase: SupabaseClient,
  projectId: string,
  platformId: string,
  targetPhase: string,
  repoType: string = 'nextjs'
): Promise<{ canProgress: boolean; reason?: string }> => {
  try {
    const { data: project } = await supabase
      .from('customer_projects')
      .select('app_type')
      .eq('id', projectId)
      .single();

    if (!project?.app_type) {
      return { canProgress: true };
    }

    const templateResult = await getAppTypeTemplate(supabase, project.app_type);
    if (!templateResult.success || !templateResult.data) {
      return { canProgress: true };
    }

    const phases = getPhasesForRepoType(templateResult.data.build_phases, repoType);
    const phaseConfig = phases.find((p) => p.id === targetPhase);
    if (!phaseConfig?.depends_on?.length) {
      return { canProgress: true };
    }

    for (const depPhase of phaseConfig.depends_on) {
      const completed = await areAllTasksCompletedForPhase(
        supabase,
        projectId,
        platformId,
        depPhase,
        project.app_type,
        repoType
      );
      if (!completed) {
        const depPhaseConfig = phases.find((p) => p.id === depPhase);
        const depName = depPhaseConfig?.name || depPhase;
        return {
          canProgress: false,
          reason: `Phase "${depName}" must be completed first`,
        };
      }
    }

    return { canProgress: true };
  } catch (err) {
    console.error('Error validating phase dependencies:', err);
    return { canProgress: false, reason: 'Failed to validate phase' };
  }
};

const areAllTasksCompletedForPhase = async (
  supabase: SupabaseClient,
  projectId: string,
  platformId: string,
  phaseId: string,
  appType: string,
  repoType: string = 'nextjs'
): Promise<boolean> => {
  const templateResult = await getAppTypeTemplate(supabase, appType);
  if (!templateResult.success || !templateResult.data) return true;

  const phases = getPhasesForRepoType(templateResult.data.build_phases, repoType);
  const phaseConfig = phases.find((p) => p.id === phaseId);
  if (!phaseConfig?.tasks?.length) return true;

  const taskTypes = phaseConfig.tasks;

  const { data: taskRows } = await supabase
    .from('data_entity_generation_tasks')
    .select('id')
    .in('task_type', taskTypes);

  const taskIds = (taskRows || []).map((t) => t.id);
  if (taskIds.length === 0) return true;

  const { data: entities } = await supabase
    .from('data_entity')
    .select('id, assigned_repo_ids')
    .eq('project_id', projectId);

  const entityIds = (entities || [])
    .filter((e) => {
      const repoIds = (e as { assigned_repo_ids?: string[] }).assigned_repo_ids ?? [];
      return repoIds.length === 0 || repoIds.includes(platformId);
    })
    .map((e) => e.id);
  if (entityIds.length === 0) return true;

  const { data: selectedTasks } = await supabase
    .from('data_entity_selected_tasks')
    .select('entity_id, task_id, status')
    .in('entity_id', entityIds)
    .in('task_id', taskIds);

  const completedByEntity = new Map<string, Set<string>>();
  for (const st of selectedTasks || []) {
    if (st.status !== 'completed') continue;
    if (!completedByEntity.has(st.entity_id)) {
      completedByEntity.set(st.entity_id, new Set());
    }
    completedByEntity.get(st.entity_id)!.add(st.task_id);
  }

  const requiredTaskCount = taskIds.length;
  for (const entityId of entityIds) {
    const completed = completedByEntity.get(entityId);
    if (!completed || completed.size < requiredTaskCount) {
      return false;
    }
  }

  return true;
};
