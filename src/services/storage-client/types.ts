/** Connection details for code-generator-storage-server (canonical Postgres CRUD). */
export type StorageClient = {
  baseUrl: string;
  secret: string;
};

export type StorageEnvelope<T> = {
  success: boolean;
  data?: T;
  error?: string;
};
