export type ARDTask = {
  id: string;
  name: string;
  task_type: string;
  description: string | null;
  prompt_template: string;
  output_path_template: string;
  stack_type: 'express' | 'nextjs' | 'react-native';
  sort_order: number;
  created_at: string;
  updated_at: string;
};
