export type SeedExportPayload = {
  exportedAt: string;
  tables: Record<string, Record<string, unknown>[]>;
};

export type TempImportResult = {
  exportedAt: string;
  importedAt: string;
  tableRowCounts: Record<string, number>;
};
