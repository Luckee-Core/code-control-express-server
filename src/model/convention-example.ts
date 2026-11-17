export type ConventionExampleKind = 'correct' | 'incorrect';

export type ConventionExampleLanguage = 'sql' | 'ts' | 'tsx' | 'json' | 'text';

/** Row in convention_examples. */
export type ConventionExample = {
  id: string;
  convention_id: string;
  title: string;
  kind: ConventionExampleKind;
  language: ConventionExampleLanguage;
  path_hint: string | null;
  code: string;
  note: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type CreateConventionExampleInput = {
  convention_id: string;
  title: string;
  kind: ConventionExampleKind;
  language: ConventionExampleLanguage;
  path_hint?: string | null;
  code: string;
  note?: string;
  sort_order?: number;
};

export type UpdateConventionExampleInput = {
  title?: string;
  kind?: ConventionExampleKind;
  language?: ConventionExampleLanguage;
  path_hint?: string | null;
  code?: string;
  note?: string;
  sort_order?: number;
};
