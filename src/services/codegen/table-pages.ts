import type { CrudTable } from './crud-operations';
import { buildTableListView, type TableListView } from './table-list-view';

/** Web routes for one table: list and static detail paths (web ADR 008) and their constants. */
export type TablePage = {
  /** Sidebar / breadcrumb label: business_facts → Business facts. */
  label: string;
  /** /business-facts */
  list_path: string;
  /** /business-fact-detail-page */
  detail_path: string;
  /** BUSINESS_FACTS_PATH */
  list_const: string;
  /** BUSINESS_FACT_DETAIL_PAGE_PATH */
  detail_const: string;
  /** src/app/(app)/business-facts/page.tsx */
  list_page_file: string;
  /** The list page is already in the repo (in the (app) route group or at the app root). */
  has_list_page: boolean;
  /** src/app/(app)/business-fact-detail-page/page.tsx */
  detail_page_file: string;
  /** The detail page is already in the repo: list rows open it. */
  has_detail_page: boolean;
  /** Columns, search fields and filters for the generated list page. */
  list: TableListView;
};

const constName = (kebab: string): string => kebab.replace(/-/g, '_').toUpperCase();

const humanize = (table: string): string => {
  const text = table.replace(/[_-]+/g, ' ').trim().toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
};

const inRepo = (paths: Set<string> | null, appFile: string): boolean =>
  Boolean(paths && (paths.has(appFile) || paths.has(appFile.replace('src/app/(app)/', 'src/app/'))));

/** Routes per table; has_list_page / has_detail_page are false when the repo paths are unknown. */
export const buildTablePages = (tables: CrudTable[], paths: Set<string> | null): TablePage[] =>
  tables.map((crud) => {
    const name = crud.names;
    const listPageFile = `src/app/(app)/${name.folder}/page.tsx`;
    const detailPageFile = `src/app/(app)/${name.entity}-detail-page/page.tsx`;
    return {
      label: humanize(name.table),
      list_path: `/${name.folder}`,
      detail_path: `/${name.entity}-detail-page`,
      list_const: `${constName(name.folder)}_PATH`,
      detail_const: `${constName(name.entity)}_DETAIL_PAGE_PATH`,
      list_page_file: listPageFile,
      has_list_page: inRepo(paths, listPageFile),
      detail_page_file: detailPageFile,
      has_detail_page: inRepo(paths, detailPageFile),
      list: buildTableListView(crud),
    };
  });
