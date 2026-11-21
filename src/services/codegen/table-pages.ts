import type { TableNames } from './crud-operations';

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
};

const constName = (kebab: string): string => kebab.replace(/-/g, '_').toUpperCase();

const humanize = (table: string): string => {
  const text = table.replace(/[_-]+/g, ' ').trim().toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
};

/** Routes per table; has_list_page is false when the repo paths are unknown. */
export const buildTablePages = (names: TableNames[], paths: Set<string> | null): TablePage[] =>
  names.map((name) => {
    const listPageFile = `src/app/(app)/${name.folder}/page.tsx`;
    return {
      label: humanize(name.table),
      list_path: `/${name.folder}`,
      detail_path: `/${name.entity}-detail-page`,
      list_const: `${constName(name.folder)}_PATH`,
      detail_const: `${constName(name.entity)}_DETAIL_PAGE_PATH`,
      list_page_file: listPageFile,
      has_list_page: Boolean(paths && (paths.has(listPageFile) || paths.has(`src/app/${name.folder}/page.tsx`))),
    };
  });
