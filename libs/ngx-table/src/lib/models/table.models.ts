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

/** Row height mode toggled from the toolbar. */
export type TableDensity = 'comfortable' | 'compact';

/** Runtime pinning of a column to the start or end edge. */
export type TablePin = 'start' | 'end';

/** Built-in footer aggregation for a column. */
export type TableAggregateType = 'sum' | 'avg' | 'min' | 'max' | 'count';

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
  /**
   * Show the full cell text as a native tooltip (for truncated values). Defaults to `true`;
   * set to `false` on columns where a tooltip would be noise.
   */
  tooltip?: boolean;
  /**
   * Keep the column at the start/end edge while the table scrolls horizontally.
   * Sticky columns should declare a `width` so the next sticky column can be offset.
   */
  sticky?: TablePin;
  /** Allow pinning / unpinning this column from the header menu. Defaults to `true`. */
  pinnable?: boolean;
  /** Allow hiding this column from the header menu. Defaults to `true`. */
  hideable?: boolean;
  /** Footer aggregation shown when the column declares `aggregate`. */
  aggregate?: TableAggregateType | TableAggregate<T>;
}

/** Column aggregate: a bare type (`'sum'`) or a type plus custom label/format. */
export interface TableAggregate<T = any> {
  type: TableAggregateType;
  /** Text drawn before the value, e.g. `'Total'`. Defaults to the type name. */
  label?: string;
  /** Custom number formatter; overrides the default locale formatting. */
  format?: (value: number, column: TableColumn<T>) => string;
}

/** One bulk action rendered in the selection bar. */
export interface TableSelectionAction<T = any> {
  /** Identifies the action in `(selectionAction)` events. */
  id: string;
  label: string;
  icon?: string;
  class?: string;
  title?: string;
}

/** Emitted when a selection bar action is clicked. */
export interface TableSelectionActionEvent<T = any> {
  action: TableSelectionAction<T>;
  rows: T[];
}

/** Emitted when the toolbar export is used. */
export interface TableExportEvent<T = any> {
  format: 'csv' | 'xlsx';
  fileName: string;
  blob: Blob;
  /** Rows that were written (the selection when there is one). */
  rows: T[];
}

/** Everything the user can change at runtime and that `storageKey` remembers. */
export interface TablePresetState {
  hidden: string[];
  density: TableDensity;
  /** Column keys in display order (hidden columns keep their slot). */
  order: string[];
  /** Runtime widths in px, keyed by column key. */
  widths: Record<string, number>;
  /** Runtime pinning, keyed by column key. */
  pinned: Record<string, TablePin>;
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

/** Emitted when a cell (or row) is copied to the clipboard. */
export interface TableCellCopyEvent<T = any> {
  /** Plain text written to the clipboard. */
  value: string;
  row: T;
  index: number;
  /** `null` when the whole row was copied. */
  column: TableColumn<T> | null;
}

/** Emitted on right-click (or the context-menu key) on a row. */
export interface TableRowMenuEvent<T = any> {
  row: T;
  index: number;
  /** Position of the pointer, for consumer-owned menus. */
  x: number;
  y: number;
  /** The originating event (`MouseEvent` or `KeyboardEvent`). */
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

/** Context of the projected `#ithTableRowMenu` template. */
export interface TableRowMenuContext<T = any> {
  $implicit: T;
  row: T;
  index: number;
}

/** Context of the projected `#ithTableRowDetail` template. */
export interface TableRowDetailContext<T = any> {
  $implicit: T;
  row: T;
  index: number;
  /** Closes the detail panel for this row. */
  close: () => void;
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
