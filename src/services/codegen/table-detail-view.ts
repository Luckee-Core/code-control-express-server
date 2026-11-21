import type { CrudTable } from './crud-operations';
import { toListColumn, type ListColumn, type TableListView } from './table-list-view';

/** One related-data tab on a detail page. */
export type DetailTab = {
  /** Folder under the detail package and tab key: fact-sources, s3-files-by-owner-id. */
  key: string;
  /** PascalCase component stem: FactSources, S3FilesByOwnerId. */
  component: string;
  /** Tab label: Fact sources, S3 files (owner). */
  label: string;
  /** child = rows of a table with an FK to this one; join = the other side of a link table. */
  kind: 'child' | 'join';
  /** Index into it.tables of the rows the tab lists (the child, or the join's other side). */
  rows_index: number;
  /** child: the FK column on the child; join: the join's column pointing at this table. */
  fk_column: string;
  /** join: index of the link table (-1 for child). */
  join_index: number;
  /** join: the link table's column pointing at the listed table ('' for child). */
  join_other_column: string;
};

/** A foreign key shown on the summary panel as a link to the parent's detail page. */
export type DetailReference = {
  column: string;
  /** Index into it.tables of the parent. */
  parent_index: number;
};

/** What a generated detail page shows and edits, derived from the data model. */
export type TableDetailView = {
  /** Column whose value is the page title ('' = the table label). */
  title_column: string;
  /** Read-only fields on the summary panel (every column except deleted_at). */
  fields: ListColumn[];
  /** Fields the edit modal changes (no json, arrays or lifecycle timestamps). */
  form_fields: ListColumn[];
  references: DetailReference[];
  tabs: DetailTab[];
};

const HIDDEN = new Set(['deleted_at']);
const EDITABLE: ReadonlySet<ListColumn['kind']> = new Set(['text', 'enum', 'boolean', 'number', 'date', 'timestamp', 'reference']);

const humanize = (name: string): string => {
  const text = name.replace(/_/g, ' ').trim().toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
};

const pascal = (kebab: string): string =>
  kebab
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

/** Label of a table for tabs: business_facts → Business facts. */
const tableLabel = (crud: CrudTable): string => humanize(crud.names.table);

/** fk owner_id → "owner"; business_fact_id → "business fact". */
const fkLabel = (column: string): string => humanize(column.replace(/_id$/, '')).toLowerCase();

/**
 * Detail view for every table: summary fields, edit form fields, parent links and related tabs.
 * Tabs: each non-join table with an FK to this one, and for each link table pointing here, the
 * table on its other side. Several FKs from one child to this table get one tab each.
 */
export const buildTableDetailViews = (tables: CrudTable[], lists: TableListView[]): TableDetailView[] => {
  const indexOf = new Map(tables.map((crud, index) => [crud.names.table, index]));
  return tables.map((crud) => {
    const all = crud.columns.map((column) => toListColumn(column, crud.names.Entity));
    const fields = all.filter((column) => !HIDDEN.has(column.name));
    const references = fields
      .filter((column) => column.references_table && indexOf.has(column.references_table))
      .map((column) => ({ column: column.name, parent_index: indexOf.get(column.references_table)! }));

    const tabs: DetailTab[] = [];
    tables.forEach((other, otherIndex) => {
      const pointing = other.columns.filter((column) => column.references_table === crud.names.table);
      if (pointing.length === 0) return;
      if (lists[otherIndex].is_join) {
        // Link table: list the table(s) on its other side(s).
        for (const here of pointing) {
          for (const there of other.columns) {
            if (there === here || !there.references_table || !indexOf.has(there.references_table)) continue;
            const rowsIndex = indexOf.get(there.references_table)!;
            if (lists[rowsIndex].is_join) continue;
            const base = tables[rowsIndex].names.folder;
            const ambiguous = other.columns.filter((column) => column.references_table && column !== here).length > 1 || pointing.length > 1;
            const key = ambiguous ? `${base}-via-${other.names.folder}` : base;
            tabs.push({
              key,
              component: pascal(key),
              label: ambiguous ? `${tableLabel(tables[rowsIndex])} (${humanize(other.names.table).toLowerCase()})` : tableLabel(tables[rowsIndex]),
              kind: 'join',
              rows_index: rowsIndex,
              fk_column: here.name,
              join_index: otherIndex,
              join_other_column: there.name,
            });
          }
        }
        return;
      }
      for (const column of pointing) {
        const key = pointing.length > 1 ? `${other.names.folder}-by-${column.name.replace(/_/g, '-')}` : other.names.folder;
        tabs.push({
          key,
          component: pascal(key),
          label: pointing.length > 1 ? `${tableLabel(other)} (${fkLabel(column.name)})` : tableLabel(other),
          kind: 'child',
          rows_index: otherIndex,
          fk_column: column.name,
          join_index: -1,
          join_other_column: '',
        });
      }
    });
    // Two tabs can't share a folder (e.g. a child and a link table both reaching one table):
    // a colliding join tab is named after its link table, anything else gets a number.
    const seen = new Map<string, number>();
    for (const tab of tabs) {
      if (seen.has(tab.key) && tab.kind === 'join') {
        const via = tables[tab.join_index].names;
        tab.key = `${tab.key}-via-${via.folder}`;
        tab.label = `${tab.label} (via ${humanize(via.table).toLowerCase()})`;
      }
      const count = seen.get(tab.key) ?? 0;
      seen.set(tab.key, count + 1);
      if (count > 0) tab.key = `${tab.key}-${count + 1}`;
      tab.component = pascal(tab.key);
    }

    const primary = fields.find((column) => column.kind === 'text' && !column.multiline) ?? fields.find((column) => column.kind === 'text');
    return {
      title_column: primary?.name ?? '',
      fields,
      form_fields: fields.filter((column) => EDITABLE.has(column.kind) && !(column.kind === 'reference' && !column.references_table)),
      references,
      tabs,
    };
  });
};
