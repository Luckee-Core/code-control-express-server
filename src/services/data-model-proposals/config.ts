/** Conventions domain + repo role the data-model AI reads. */
export const DATA_MODEL_DOMAIN_KEY = 'data_model';
export const DATA_MODEL_ROLE_KEY = 'storage';

/**
 * The proposal step decides which tables and columns exist. Conventions about how files are
 * written later (migrations, model files, data functions, the storage split) and anything about
 * seeding belong to the render/commit step, so the AI never sees them here.
 */
export const PROPOSAL_CONVENTION_EXCLUSIONS = {
  topic_keys: [
    'data_model.migrations',
    'data_model.model_types',
    'data_model.data_layer',
    'data_model.storage_split',
  ],
  convention_keys: ['dm.col.text_pk_catalogs_only'],
  archetype_keys: ['seeded_catalog'],
};

/** AI prompt type in services/ai/model-config.ts. */
export const DATA_MODEL_PROMPT_TYPE = 'data_model_proposal';

export const MAX_CONTEXT_CHARS = 100_000;
export const MAX_FEEDBACK_CHARS = 20_000;

/** A proposal stuck in `running` longer than this was interrupted (e.g. Express restarted). */
export const STALE_RUNNING_MS = 20 * 60 * 1000;

/** One extra AI pass when the first answer breaks MUST/NEVER rules. */
export const MAX_AUTO_FIX_PASSES = 1;
