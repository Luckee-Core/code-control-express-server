export type ProjectRepo = {
  id: string;
  customer_id: string;
  project_id: string;
  repo_type: 'express' | 'nextjs' | 'react-native';
  name: string;
  repo_url: string;
  clone_url: string | null;
  current_phase: string | null;
  phase_status: string | null;
  created_at: string;
  updated_at: string;
};
