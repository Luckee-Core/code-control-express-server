/** Connection details for code-generator-storage-server (canonical Postgres CRUD). */
export type StorageClient = {
  baseUrl: string;
  accessMode: 'direct' | 'gateway';
  /** Set in direct mode only. */
  secret: string | null;
  /** Set in gateway mode only. */
  gateSecret: string | null;
};

export type StorageEnvelope<T> = {
  success: boolean;
  data?: T;
  error?: string;
};
