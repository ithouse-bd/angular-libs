/**
 * Public models for `<ith-table>`.
 */

/** How the table obtains its rows. */
export type TableMode = 'client' | 'server';

/** `none` hides the checkbox column, `single` allows one row, `multi` allows many. */
export type TableSelectionMode = 'none' | 'single' | 'multi';

/** Whether the header checkbox selects the current page or every filtered row. */
export type TableSelectAllScope = 'page' | 'all';

export type TableAlign = 'left' | 'center' | 'right';

export type TableSortDirection = 'asc' | 'desc';

/** Control rendered in the filter row for a column. */
export type TableFilterType = 'text' | 'number' | 'date' | 'select';

/** Option of a `select` filter. */
export interface TableFilterOption {
  label: string;
  value: unknown;
}

/** Active sort state. */
export interface TableSort {
  /** `key` of the sorted column. */
  key: string;
  direction: TableSortDirection;
}

/**
 * Column definition. Every column is addressed by `key`, which is also the
 * name used by `#ithTableCell="key"` / `#ithTableHeader="key"` templates.
 */
export interface TableColumn<T = any> {
  /** Unique column id. */
  key: string;
  /** Header label. Defaults to the key. */
  header?: string;
  /** Dot-path (e.g. `student.name`) used to read the cell value. Defaults to `key`. */
  field?: string;
  /** Defaults to the table-level `sortable` input. */
  sortable?: boolean;
  /** Include this column in the global search. Defaults to `true`. */
  searchable?: boolean;
  /** Show an input for this column when `showFilters` is enabled. Defaults to `true`. */
  filterable?: boolean;
  /** Control used by the filter row. Defaults to `text`. */
  filterType?: TableFilterType;
  /** Options for a `select` filter. */
  filterOptions?: TableFilterOption[];
  /** Placeholder for this column's filter control. */
  filterPlaceholder?: string;
  /**
   * Custom matching rule for this column. Return `true` to keep the row.
   * `cellValue` is the raw value read through `field`, `filterValue` the current
   * filter text.
   */
  filterPredicate?: (cellValue: unknown, filterValue: string, row: T) => boolean;
  align?: TableAlign;
  /** CSS width, e.g. `'120px'` or `'20%'`. */
  width?: string;
  minWidth?: string;
  /** Hide the column without removing it from the configuration. */
  hidden?: boolean;
  headerClass?: string;
  cellClass?: string | ((row: T, index: number) => string | string[] | Record<string, boolean> | undefined);
  /** Format the display value. Searching and filtering also use this output. */
  formatter?: (value: unknown, row: T, index: number) => string | number | null | undefined;
  /** Custom ascending comparator. */
  sortFn?: (a: T, b: T) => number;
  /** Custom text used by the global search. Defaults to the formatted cell value. */
  searchValue?: (row: T) => string;
  /** Custom text used by the per-column filter. Defaults to the formatted cell value. */
  filterValue?: (row: T) => string;
}

/** Declarative row action button rendered in the actions column. */
export interface TableRowAction<T = any> {
  /** Identifies the action in `(actionClick)` events. */
  id: string;
  label: string;
  /** Any short text/emoji shown before the label. */
  icon?: string;
  /** Extra CSS class(es) for the button. */
  class?: string;
  /** Native tooltip. */
  title?: string;
  disabled?: (row: T, index: number) => boolean;
  hidden?: (row: T, index: number) => boolean;
}

export interface TableActionEvent<T = any> {
  action: TableRowAction<T>;
  row: T;
  index: number;
}

export interface TableRowEvent<T = any> {
  row: T;
  index: number;
  /** Mouse click, or the keyboard event when a clickable row is activated with Enter/Space. */
  event: Event;
}

/* ------------------------------------------------------------------ */
/* Template contexts                                                   */
/* ------------------------------------------------------------------ */

export interface TableCellContext<T = any> {
  $implicit: T;
  row: T;
  column: TableColumn<T>;
  value: unknown;
  index: number;
}

export interface TableHeaderContext<T = any> {
  $implicit: TableColumn<T>;
  column: TableColumn<T>;
}

export interface TableRowActionsContext<T = any> {
  $implicit: T;
  row: T;
  index: number;
}

export interface TableFilterContext<T = any> {
  $implicit: string;
  value: string;
  column: TableColumn<T>;
  setValue: (value: string) => void;
}

export interface TableToolbarContext<T = any> {
  rows: T[];
  total: number;
  selected: T[];
  search: string;
}

export interface TableFooterContext<T = any> extends TableToolbarContext<T> {
  page: number;
  pageSize: number;
  pageCount: number;
}
