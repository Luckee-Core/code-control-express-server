const exportLine = (entity: string): string => `export type * from './${entity}';`;

const exportsEntity = (content: string, entity: string): boolean =>
  new RegExp(`from\\s+['"]\\./${entity.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}(?:/index)?['"]`).test(content);

/**
 * Adds `export type * from './{entity}'` for every entity the barrel does not export yet,
 * keeping every existing line. Returns null when nothing changes.
 */
export const mergeModelBarrel = (existing: string | null, entities: string[]): string | null => {
  const current = existing ?? '';
  const missing = entities.filter((entity) => !exportsEntity(current, entity));
  if (missing.length === 0 && existing !== null) return null;
  const base = current.trimEnd();
  const lines = missing.map(exportLine);
  return `${base ? `${base}\n` : ''}${lines.join('\n')}\n`;
};
