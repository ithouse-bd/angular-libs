import { NgClass, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  TemplateRef,
  afterNextRender,
  computed,
  contentChildren,
  effect,
  inject,
  input,
  model,
  output,
  signal,
  untracked,
} from '@angular/core';

import {
  TableCellDirective,
  TableEmptyDirective,
  TableFilterDirective,
  TableFooterDirective,
  TableHeaderDirective,
  TableRowActionsDirective,
  TableRowDetailDirective,
  TableRowMenuDirective,
  TableToolbarDirective,
} from '../../directives/table-template.directives';
import {
  TableActionEvent,
  TableAggregate,
  TableAggregateType,
  TableCellContext,
  TableCellCopyEvent,
  TableColumn,
  TableDensity,
  TableExportEvent,
  TableFilterContext,
  TableFilterOption,
  TableFilterType,
  TableMode,
  TablePin,
  TablePresetState,
  TableRowAction,
  TableRowDetailContext,
  TableRowEvent,
  TableRowMenuContext,
  TableRowMenuEvent,
  TableSelectAllScope,
  TableSelectionAction,
  TableSelectionActionEvent,
  TableSelectionMode,
  TableSort,
  TableSortDirection,
} from '../../models/table.models';
import {
  buildPageWindow,
  compareWithDirection,
  defaultCompare,
  getPathValue,
  isInteractiveTarget,
  toDisplay,
} from '../../utils/table.utils';
import { buildXlsxBlob } from '../../utils/xlsx.utils';

let tableIdCounter = 0;

/** Where a floating menu should be drawn (viewport coordinates). */
interface FloatingPosition {
  x: number;
  y: number;
}

/** Column menu state. */
interface ColumnMenuState extends FloatingPosition {
  key: string;
}

/** One removable filter chip. */
interface FilterChip {
  kind: 'search' | 'filter';
  key: string;
  label: string;
  value: string;
}

const DEFAULT_COLUMN_WIDTH = 140;
const MIN_COLUMN_WIDTH = 56;

/**
 * Generic, standalone data table.
 *
 * ```html
 * <ith-table
 *   title="Student List"
 *   [data]="students"
 *   [columns]="columns"
 *   selectionMode="multi"
 *   [pageSize]="10">
 * </ith-table>
 * ```
 */
@Component({
  selector: 'ith-table',
  // Note: the custom-template directives are *projected* by the consumer, so they
  // are imported by the consumer, not declared here.
  imports: [NgClass, NgTemplateOutlet],
  templateUrl: './table.component.html',
  styleUrl: './table.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableComponent<T = any> {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Unique prefix for generated DOM ids. */
  readonly idBase = `ith-table-${tableIdCounter++}`;

  /* ---------------------------------------------------------------- */
  /* Data                                                             */
  /* ---------------------------------------------------------------- */

  /** Rows to render. In `server` mode this is the current page. */
  readonly data = input<T[]>([]);
  readonly columns = input<TableColumn<T>[]>([]);
  /** Look up a unique key on each row (dot-path allowed). */
  readonly keyField = input<string>('id');
  /** `client` sorts/searches/pages the array locally; `server` emits events instead. */
  readonly mode = input<TableMode>('client');
  /** Total row count for `server` mode (defaults to `data().length`). */
  readonly total = input<number>(0);

  /* ---------------------------------------------------------------- */
  /* Toolbar / labels                                                 */
  /* ---------------------------------------------------------------- */

  readonly title = input<string>('');
  readonly countSuffix = input<string>('items');
  readonly totalLabel = input<string>('Total Found');
  readonly showToolbar = input<boolean>(true);
  readonly searchable = input<boolean>(true);
  readonly searchPlaceholder = input<string>('Search…');
  readonly showFilters = input<boolean>(false);
  readonly filterPlaceholder = input<string>('Filter…');
  /** Label of the empty option in `select` filters. */
  readonly filterAllLabel = input<string>('All');
  readonly emptyText = input<string>('No records found');
  /** Accessible name of the table. */
  readonly ariaLabel = input<string>('Data table');

  /* ---------------------------------------------------------------- */
  /* Sorting                                                          */
  /* ---------------------------------------------------------------- */

  /** Active sort, two-way bindable. `null` means unsorted. */
  readonly sort = model<TableSort | null>(null);
  /** Table-wide sort switch; individual columns can opt out with `sortable: false`. */
  readonly sortable = input<boolean>(true);

  /* ---------------------------------------------------------------- */
  /* Search / filters / pagination                                    */
  /* ---------------------------------------------------------------- */

  /** Global search term, two-way bindable. Also emitted as `searchChange`. */
  readonly search = model<string>('');
  /** Emitted whenever a per-column filter changes. */
  readonly filterChange = output<Record<string, string>>();
  readonly page = model<number>(1);
  readonly pageSize = model<number>(10);
  readonly pageSizeOptions = input<number[]>([10, 20, 50, 100]);
  readonly showPagination = input<boolean>(true);
  readonly showPageSize = input<boolean>(true);
  readonly showFirstLast = input<boolean>(true);
  /** How many numbered page buttons are rendered. */
  readonly maxPageButtons = input<number>(5);
  readonly showFooter = input<boolean>(true);
  /** Render removable chips for the active search term and column filters. */
  readonly showFilterChips = input<boolean>(true);

  /* ---------------------------------------------------------------- */
  /* Selection                                                        */
  /* ---------------------------------------------------------------- */

  readonly selectionMode = input<TableSelectionMode>('none');
  readonly selectAllScope = input<TableSelectAllScope>('page');
  /** Selected rows, two-way bindable. */
  readonly selected = model<T[]>([]);
  /** Selecting a row by clicking anywhere on it (not only the checkbox). */
  readonly selectOnRowClick = input<boolean>(false);
  /** Bulk actions rendered in the selection bar once rows are selected. */
  readonly selectionActions = input<TableSelectionAction<T>[]>([]);

  /* ---------------------------------------------------------------- */
  /* Row actions / presentation                                       */
  /* ---------------------------------------------------------------- */

  readonly rowActions = input<TableRowAction<T>[]>([]);
  readonly actionsHeader = input<string>('Actions');
  readonly actionsWidth = input<string>('120px');
  readonly rowClickable = input<boolean>(false);
  readonly rowClass = input<
    (row: T, index: number) => string | string[] | Record<string, boolean> | undefined | null
  >();
  readonly loading = input<boolean>(false);
  readonly loadingText = input<string>('Loading…');
  readonly striped = input<boolean>(false);
  readonly hoverable = input<boolean>(true);
  readonly bordered = input<boolean>(false);
  readonly dense = input<boolean>(false);
  readonly stickyHeader = input<boolean>(false);
  /** CSS max-height of the scroll container, e.g. `'480px'`. */
  readonly maxHeight = input<string>('');

  /* ---------------------------------------------------------------- */
  /* Copy / context menu / column presets                             */
  /* ---------------------------------------------------------------- */

  /** Show a copy button on hover and enable Ctrl/Cmd+C on a focused cell. */
  readonly copyable = input<boolean>(false);
  /** Show the toolbar "Columns" popover (visibility switching). */
  readonly showColumnPicker = input<boolean>(false);
  /** Show the comfortable/compact density toggle in the toolbar. */
  readonly showDensityToggle = input<boolean>(false);
  /** Show the per-column header menu (sort, pin, autosize, hide). */
  readonly showColumnMenu = input<boolean>(true);
  /** Show the toolbar "Export" button (CSV download). */
  readonly showExport = input<boolean>(false);
  /** Base file name used by `downloadCsv()`. */
  exportFileName = input<string>('table');
  /** Show the toolbar "Views" menu for saving/loading named presets. */
  readonly showViews = input<boolean>(false);
  /** Allow dragging the column separator to resize a column. */
  readonly resizable = input<boolean>(false);
  /** Allow dragging a header onto another header to reorder columns. */
  readonly reorderable = input<boolean>(false);
  /** Arrow-key navigation across cells with a single tab stop. */
  readonly keyboardNavigation = input<boolean>(true);
  /**
   * localStorage key for the saved column/density preset. When set, the user's
   * choice is restored on the next visit.
   */
  readonly storageKey = input<string>('');
  /** Number of placeholder rows rendered while `loading` and there are no rows. */
  readonly skeletonRows = input<number>(6);
  /**
   * Minimum number of body rows the grid keeps in view. Rows stay at their natural
   * height, the spare space stays empty, so a table with one row does not collapse
   * into a single line. `0` lets the grid shrink to its content.
   */
  readonly minRows = input<number>(4);
  /** Stick the checkbox column to the start edge. */
  readonly stickySelection = input<boolean>(false);
  /** Stick the actions column to the end edge. */
  readonly stickyActions = input<boolean>(false);

  /* ---------------------------------------------------------------- */
  /* Row detail                                                       */
  /* ---------------------------------------------------------------- */

  /** How the `#ithTableRowDetail` template is expanded. */
  readonly rowDetailTrigger = input<'button' | 'row' | 'none'>('button');

  /* ---------------------------------------------------------------- */
  /* Events                                                           */
  /* ---------------------------------------------------------------- */

  readonly actionClick = output<TableActionEvent<T>>();
  readonly rowClick = output<TableRowEvent<T>>();
  /** Emitted after a cell or row was copied to the clipboard. */
  readonly cellCopy = output<TableCellCopyEvent<T>>();
  /** Emitted on right-click / context-menu key; the menu is positioned at the pointer. */
  readonly rowContextMenu = output<TableRowMenuEvent<T>>();
  /** Visible column keys, emitted whenever the user changes column visibility. */
  readonly columnsChange = output<string[]>();
  readonly densityChange = output<TableDensity>();
  /** Full user-chosen layout (hidden, density, order, widths, pinned). */
  readonly columnStateChange = output<TablePresetState>();
  /** Bulk action clicked in the selection bar. */
  readonly selectionAction = output<TableSelectionActionEvent<T>>();
  /** Emitted with the generated CSV text after `downloadCsv()` / the toolbar button. */
  readonly csvExport = output<string>();
  /** Emitted for both downloads (CSV and XLSX) with the produced file. */
  readonly exportFile = output<TableExportEvent<T>>();

  /* ---------------------------------------------------------------- */
  /* Custom templates                                                 */
  /* ---------------------------------------------------------------- */

  private readonly cellDirectives = contentChildren(TableCellDirective, { descendants: true });
  private readonly headerDirectives = contentChildren(TableHeaderDirective, { descendants: true });
  private readonly filterDirectives = contentChildren(TableFilterDirective, { descendants: true });
  private readonly rowActionsDirectives = contentChildren(TableRowActionsDirective, {
    descendants: true,
  });
  private readonly toolbarDirectives = contentChildren(TableToolbarDirective, { descendants: true });
  private readonly footerDirectives = contentChildren(TableFooterDirective, { descendants: true });
  private readonly emptyDirectives = contentChildren(TableEmptyDirective, { descendants: true });
  private readonly rowMenuDirectives = contentChildren(TableRowMenuDirective, {
    descendants: true,
  });
  private readonly rowDetailDirectives = contentChildren(TableRowDetailDirective, {
    descendants: true,
  });

  readonly cellTemplates = computed(() => {
    const templates = new Map<string, TemplateRef<TableCellContext<T>>>();
    for (const directive of this.cellDirectives()) {
      templates.set(directive.columnKey(), directive.template as TemplateRef<TableCellContext<T>>);
    }
    return templates;
  });

  readonly headerTemplates = computed(() => {
    const templates = new Map<string, TemplateRef<any>>();
    for (const directive of this.headerDirectives()) {
      templates.set(directive.columnKey(), directive.template);
    }
    return templates;
  });

  readonly filterTemplates = computed(() => {
    const templates = new Map<string, TemplateRef<TableFilterContext<T>>>();
    for (const directive of this.filterDirectives()) {
      templates.set(directive.columnKey(), directive.template as TemplateRef<TableFilterContext<T>>);
    }
    return templates;
  });

  readonly rowActionsTemplate = computed<TemplateRef<any> | undefined>(
    () => this.rowActionsDirectives()[0]?.template,
  );
  readonly toolbarTemplate = computed<TemplateRef<any> | undefined>(
    () => this.toolbarDirectives()[0]?.template,
  );
  readonly footerTemplate = computed<TemplateRef<any> | undefined>(
    () => this.footerDirectives()[0]?.template,
  );
  readonly emptyTemplate = computed<TemplateRef<any> | undefined>(
    () => this.emptyDirectives()[0]?.template,
  );
  readonly rowMenuTemplate = computed<TemplateRef<TableRowMenuContext<T>> | undefined>(
    () => this.rowMenuDirectives()[0]?.template,
  );
  readonly rowDetailTemplate = computed<TemplateRef<TableRowDetailContext<T>> | undefined>(
    () => this.rowDetailDirectives()[0]?.template,
  );

  /* ---------------------------------------------------------------- */
  /* Internal state                                                   */
  /* ---------------------------------------------------------------- */

  readonly filters = model<Record<string, string>>({});
  private skipInitialReset = true;

  /** Columns hidden at runtime (on top of `column.hidden`), persisted via `storageKey`. */
  private readonly hiddenColumnKeys = signal<ReadonlySet<string>>(new Set());
  private readonly density = signal<TableDensity>('comfortable');
  /** Runtime column order (all column keys, hidden ones included). */
  private readonly columnOrder = signal<string[]>([]);
  /** Runtime widths in px, keyed by column key. */
  private readonly columnWidths = signal<Record<string, number>>({});
  /** Runtime pinning, keyed by column key. */
  private readonly pinnedKeys = signal<Record<string, TablePin>>({});
  /** Measured header widths, used to offset stacked sticky columns. */
  private readonly measuredWidths = signal<Record<string, number>>({});
  /** Saved named views. */
  private readonly views = signal<Record<string, TablePresetState>>({});
  private readonly activeView = signal<string | null>(null);

  readonly compact = computed(() => this.dense() || this.density() === 'compact');
  readonly columnPickerOpen = signal(false);
  readonly columnsMenuPos = signal<FloatingPosition | null>(null);
  readonly viewsOpen = signal(false);
  readonly viewsMenuPos = signal<FloatingPosition | null>(null);
  /** Export-format menu; `null` when closed. */
  readonly exportMenuPos = signal<FloatingPosition | null>(null);
  readonly viewNameDraft = signal('');
  /** Header menu state; `null` when closed. */
  readonly columnMenu = signal<ColumnMenuState | null>(null);
  /** Right-click menu position; `null` when closed. */
  readonly menuState = signal<{
    row: T;
    index: number;
    x: number;
    y: number;
  } | null>(null);
  /** `${rowIndex}:${columnKey}` of the cell that was just copied (shows a check icon). */
  readonly copiedCell = signal<string | null>(null);
  /** Row keys whose detail panel is open. */
  private readonly expandedKeys = signal<ReadonlySet<string>>(new Set());
  /** Cell that owns the single tab stop of the grid. */
  readonly focusedCell = signal<{ row: number; col: number } | null>(null);
  /** Column key being dragged, and the header it hovers. */
  readonly dragKey = signal<string | null>(null);
  readonly dragOverKey = signal<string | null>(null);
  /** `true` once the scroll container is scrolled away from the top. */
  readonly scrolled = signal(false);
  private resizing: { key: string; startX: number; startWidth: number } | null = null;
  private copyTimer?: ReturnType<typeof setTimeout>;
  private measureHandle?: ReturnType<typeof requestAnimationFrame>;
  private presetLoaded = false;

  readonly skeletonIndexes = computed(() =>
    Array.from({ length: Math.max(0, this.skeletonRows()) }, (_, index) => index),
  );

  constructor() {
    // Restore the stored preset once, then persist every later change. Restoring must
    // happen here (not in the constructor body) because `storageKey` is an input and is
    // still empty until the host has bound it.
    effect(() => {
      const key = this.storageKey();
      const state = this.state();
      void this.views();
      void this.activeView();
      untracked(() => {
        if (!this.presetLoaded) {
          this.presetLoaded = true;
          if (!key) return;
          const stored = this.readPreset(key);
          if (stored) {
            this.views.set(stored.views ?? {});
            this.activeView.set(stored.activeView ?? null);
            this.applyState(stored.state);
            return;
          }
        }
        this.persistPreset(key);
      });
    });

    // In client mode any change to the query starts again from the first page. In server
    // mode the consumer owns the page (and fetches on every `pageChange`), so resetting
    // here would fire a second request for the same query change.
    effect(() => {
      this.search();
      this.filters();
      this.pageSize();
      this.sort();
      if (this.skipInitialReset) {
        this.skipInitialReset = false;
        return;
      }
      if (this.isServer()) return;
      untracked(() => this.page.set(1));
    });

    // Keep the page inside the available range.
    effect(() => {
      const lastPage = this.pageCount();
      const current = this.page();
      if (current > lastPage) untracked(() => this.page.set(lastPage));
      else if (current < 1) untracked(() => this.page.set(1));
    });

    // Sticky columns stack on measured widths, so re-measure after layout changes.
    effect(() => {
      this.pagedRows();
      this.visibleColumns();
      this.compact();
      this.density();
      untracked(() => this.scheduleMeasure());
    });

    afterNextRender(() => this.scheduleMeasure());
  }

  /* ---------------------------------------------------------------- */
  /* Derived data                                                     */
  /* ---------------------------------------------------------------- */

  readonly isServer = computed(() => this.mode() === 'server');

  /** Columns in the user's order (hidden columns keep their slot in the list). */
  readonly orderedColumns = computed(() => {
    const columns = this.columns();
    const order = this.columnOrder();
    if (!order.length) return columns;
    const indexOf = new Map(order.map((key, index) => [key, index]));
    return [...columns].sort(
      (a, b) =>
        (indexOf.get(a.key) ?? Number.MAX_SAFE_INTEGER) -
        (indexOf.get(b.key) ?? Number.MAX_SAFE_INTEGER),
    );
  });

  readonly visibleColumns = computed(() => {
    const hidden = this.hiddenColumnKeys();
    return this.orderedColumns().filter((column) => !column.hidden && !hidden.has(column.key));
  });

  readonly selectable = computed(() => this.selectionMode() !== 'none');

  readonly hasActionsColumn = computed(
    () => this.rowActions().length > 0 || !!this.rowActionsTemplate(),
  );

  readonly hasRowDetail = computed(
    () => !!this.rowDetailTemplate() && this.rowDetailTrigger() !== 'none',
  );

  /** Expander cell rendered as the first cell of every row. */
  readonly hasExpander = computed(
    () => this.hasRowDetail() && this.rowDetailTrigger() === 'button',
  );

  /** Rows that match the global search and the per-column filters (client mode). */
  readonly matchingRows = computed<T[]>(() => {
    const rows = this.data();
    if (this.isServer()) return rows;

    const term = this.search().trim().toLowerCase();
    const activeFilters = Object.entries(this.filters()).filter(([, value]) => value.trim() !== '');
    let result = rows;

    if (term) {
      const searchColumns = this.visibleColumns().filter((column) => column.searchable !== false);
      result = result.filter((row) =>
        searchColumns.some((column) => this.searchText(row, column).includes(term)),
      );
    }

    if (activeFilters.length) {
      const columns = this.visibleColumns();
      result = result.filter((row) =>
        activeFilters.every(([key, value]) => {
          const column = columns.find((candidate) => candidate.key === key);
          if (!column) return true;
          return this.columnMatchesFilter(row, column, value);
        }),
      );
    }

    return result;
  });

  /** Matching rows in the active sort order (client mode). */
  readonly sortedRows = computed<T[]>(() => {
    const rows = this.matchingRows();
    if (this.isServer()) return rows;

    const sort = this.sort();
    if (!sort) return rows;

    const column = this.columns().find((candidate) => candidate.key === sort.key);
    if (!column) return rows;

    const direction: TableSortDirection = sort.direction;
    return [...rows].sort((a, b) =>
      compareWithDirection(this.compareRows(a, b, column), direction),
    );
  });

  readonly totalRows = computed(() =>
    this.isServer() ? this.total() || this.data().length : this.sortedRows().length,
  );

  readonly pageCount = computed(() =>
    Math.max(1, Math.ceil(this.totalRows() / Math.max(1, this.pageSize()))),
  );

  /** Rows of the current page. */
  readonly pagedRows = computed<T[]>(() => {
    if (this.isServer()) return this.data();
    const size = Math.max(1, this.pageSize());
    const start = (this.page() - 1) * size;
    return this.sortedRows().slice(start, start + size);
  });

  readonly pageItems = computed(() =>
    buildPageWindow(this.page(), this.pageCount(), this.maxPageButtons()),
  );

  readonly rangeStart = computed(() =>
    this.totalRows() === 0 ? 0 : (this.page() - 1) * this.pageSize() + 1,
  );

  readonly rangeEnd = computed(() => Math.min(this.page() * this.pageSize(), this.totalRows()));

  readonly pageSizeChoices = computed(() =>
    [...new Set([...this.pageSizeOptions(), this.pageSize()])].sort((a, b) => a - b),
  );

  readonly selectedKeySet = computed(
    () => new Set(this.selected().map((row) => this.rowKey(row))),
  );

  readonly allPageSelected = computed(() => {
    const rows = this.pagedRows();
    return rows.length > 0 && rows.every((row) => this.selectedKeySet().has(this.rowKey(row)));
  });

  readonly somePageSelected = computed(
    () =>
      !this.allPageSelected() &&
      this.pagedRows().some((row) => this.selectedKeySet().has(this.rowKey(row))),
  );

  readonly emptyColspan = computed(
    () =>
      Math.max(
        1,
        this.visibleColumns().length +
          (this.selectable() ? 1 : 0) +
          (this.hasActionsColumn() ? 1 : 0) +
          (this.hasExpander() ? 1 : 0),
      ),
  );

  readonly hasQuery = computed(
    () =>
      this.search().trim() !== '' ||
      Object.values(this.filters()).some((value) => value.trim() !== ''),
  );

  /** Removable chips for the active search term and filters. */
  readonly filterChips = computed<FilterChip[]>(() => {
    const chips: FilterChip[] = [];
    const term = this.search().trim();
    if (term) {
      chips.push({ kind: 'search', key: '__search', label: 'Search', value: term });
    }
    for (const [key, value] of Object.entries(this.filters())) {
      if (!value.trim()) continue;
      const column = this.columns().find((candidate) => candidate.key === key);
      const option = this.filterOptionsFor(column ?? { key }).find(
        (candidate) => String(candidate.value) === value,
      );
      chips.push({
        kind: 'filter',
        key,
        label: column?.header ?? key,
        value: option?.label ?? value,
      });
    }
    return chips;
  });

  /** Columns that declare a footer aggregate. */
  readonly hasAggregates = computed(() =>
    this.visibleColumns().some((column) => !!column.aggregate),
  );

  /** Full user layout, the shape that `storageKey` stores. */
  readonly state = computed<TablePresetState>(() => ({
    hidden: [...this.hiddenColumnKeys()],
    density: this.density(),
    order: this.columnOrder(),
    widths: this.columnWidths(),
    pinned: this.pinnedKeys(),
  }));

  readonly savedViewNames = computed(() => Object.keys(this.views()).sort());

  /* ---------------------------------------------------------------- */
  /* Sorting API                                                      */
  /* ---------------------------------------------------------------- */

  isSortable(column: TableColumn<T>): boolean {
    return this.sortable() && column.sortable !== false;
  }

  ariaSort(column: TableColumn<T>): 'ascending' | 'descending' | 'none' {
    const sort = this.sort();
    if (!sort || sort.key !== column.key) return 'none';
    return sort.direction === 'asc' ? 'ascending' : 'descending';
  }

  sortDirection(column: TableColumn<T>): TableSortDirection | null {
    const sort = this.sort();
    return sort && sort.key === column.key ? sort.direction : null;
  }

  /** Cycles `asc` → `desc` → unsorted. */
  toggleSort(column: TableColumn<T>): void {
    if (!this.isSortable(column)) return;
    const current = this.sort();
    if (!current || current.key !== column.key) {
      this.sort.set({ key: column.key, direction: 'asc' });
    } else if (current.direction === 'asc') {
      this.sort.set({ key: column.key, direction: 'desc' });
    } else {
      this.sort.set(null);
    }
  }

  /* ---------------------------------------------------------------- */
  /* Search / filter API                                              */
  /* ---------------------------------------------------------------- */

  onSearchInput(value: string): void {
    this.search.set(value);
  }

  clearSearch(): void {
    this.search.set('');
  }

  onFilterInput(key: string, value: string): void {
    const next = { ...this.filters(), [key]: value };
    this.filters.set(next);
    this.filterChange.emit(next);
  }

  filterValue(key: string): string {
    return this.filters()[key] ?? '';
  }

  /** Control rendered in the filter row for this column. */
  filterTypeFor(column: TableColumn<T>): TableFilterType {
    return column.filterType ?? 'text';
  }

  filterOptionsFor(column: Pick<TableColumn<T>, 'key'> & Partial<TableColumn<T>>): TableFilterOption[] {
    return column.filterOptions ?? [];
  }

  filterPlaceholderFor(column: TableColumn<T>): string {
    return column.filterPlaceholder ?? this.filterPlaceholder();
  }

  filterTemplate(column: TableColumn<T>): TemplateRef<TableFilterContext<T>> | undefined {
    return this.filterTemplates().get(column.key);
  }

  /** Context handed to a custom `#ithTableFilter` template. */
  filterContext(column: TableColumn<T>): TableFilterContext<T> {
    const value = this.filterValue(column.key);
    return {
      $implicit: value,
      value,
      column,
      setValue: (next: string) => this.onFilterInput(column.key, next),
    };
  }

  clearFilters(): void {
    this.filters.set({});
    this.filterChange.emit({});
  }

  clearQuery(): void {
    this.search.set('');
    this.clearFilters();
  }

  /** Remove one chip from the chip row. */
  removeChip(chip: FilterChip): void {
    if (chip.kind === 'search') {
      this.clearSearch();
      return;
    }
    const next = { ...this.filters() };
    delete next[chip.key];
    this.filters.set(next);
    this.filterChange.emit(next);
  }

  /* ---------------------------------------------------------------- */
  /* Pagination API                                                   */
  /* ---------------------------------------------------------------- */

  goToPage(page: number): void {
    const next = Math.min(Math.max(1, Math.floor(page) || 1), this.pageCount());
    if (next !== this.page()) this.page.set(next);
  }

  nextPage(): void {
    this.goToPage(this.page() + 1);
  }

  previousPage(): void {
    this.goToPage(this.page() - 1);
  }

  firstPage(): void {
    this.goToPage(1);
  }

  lastPage(): void {
    this.goToPage(this.pageCount());
  }

  onPageSizeChange(value: number): void {
    const size = Number(value);
    if (!Number.isFinite(size) || size < 1) return;
    this.pageSize.set(size);
  }

  /* ---------------------------------------------------------------- */
  /* Selection API                                                    */
  /* ---------------------------------------------------------------- */

  rowKey(row: T): unknown {
    const key = this.keyField();
    const value = key ? getPathValue(row, key) : undefined;
    return value === undefined || value === null ? row : value;
  }

  isSelected(row: T): boolean {
    return this.selectedKeySet().has(this.rowKey(row));
  }

  toggleRow(row: T, checked: boolean): void {
    if (!this.selectable()) return;

    if (this.selectionMode() === 'single') {
      this.selected.set(checked ? [row] : []);
      return;
    }

    const key = this.rowKey(row);
    if (checked) {
      if (!this.selectedKeySet().has(key)) this.selected.set([...this.selected(), row]);
    } else {
      this.selected.set(this.selected().filter((candidate) => this.rowKey(candidate) !== key));
    }
  }

  onRowCheckboxChange(row: T, event: Event): void {
    this.toggleRow(row, (event.target as HTMLInputElement).checked);
  }

  toggleAll(checked: boolean): void {
    if (!this.selectable()) return;

    const candidates =
      this.selectAllScope() === 'all'
        ? this.isServer()
          ? this.data()
          : this.sortedRows()
        : this.pagedRows();

    if (this.selectionMode() === 'single') {
      this.selected.set(checked ? candidates.slice(0, 1) : []);
      return;
    }

    const selection = new Map(this.selected().map((row) => [this.rowKey(row), row]));
    for (const row of candidates) {
      if (checked) selection.set(this.rowKey(row), row);
      else selection.delete(this.rowKey(row));
    }
    this.selected.set([...selection.values()]);
  }

  onSelectAllChange(event: Event): void {
    this.toggleAll((event.target as HTMLInputElement).checked);
  }

  clearSelection(): void {
    this.selected.set([]);
  }

  selectRow(row: T): void {
    this.toggleRow(row, true);
  }

  deselectRow(row: T): void {
    this.toggleRow(row, false);
  }

  /** Click on a selection-bar action. */
  onSelectionAction(action: TableSelectionAction<T>, event: MouseEvent): void {
    event.stopPropagation();
    this.selectionAction.emit({ action, rows: this.selected() });
  }

  /* ---------------------------------------------------------------- */
  /* Row actions                                                      */
  /* ---------------------------------------------------------------- */

  isActionVisible(action: TableRowAction<T>, row: T, index: number): boolean {
    return action.hidden ? !action.hidden(row, index) : true;
  }

  isActionDisabled(action: TableRowAction<T>, row: T, index: number): boolean {
    return action.disabled ? action.disabled(row, index) : false;
  }

  onActionClick(
    action: TableRowAction<T>,
    row: T,
    index: number,
    event: MouseEvent,
  ): void {
    event.stopPropagation();
    this.actionClick.emit({ action, row, index });
  }

  onRowClick(row: T, index: number, event: MouseEvent): void {
    if (isInteractiveTarget(event.target)) return;
    this.activateRow(row, index, event);
  }

  /** `Enter` / `Space` activate a focusable row exactly like a mouse click. */
  onRowKeydown(row: T, index: number, event: KeyboardEvent): void {
    this.onRowContextMenuKey(row, index, event);
    if (event.defaultPrevented) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;
    if (isInteractiveTarget(event.target)) return;
    if (!this.rowClickable() && !this.selectOnRowClick() && !this.togglesDetailOnRow()) return;
    event.preventDefault();
    this.activateRow(row, index, event);
  }

  /** Shared by mouse and keyboard activation. */
  private activateRow(row: T, index: number, event: Event): void {
    if (this.rowClickable()) this.rowClick.emit({ row, index, event });
    if (this.selectOnRowClick() && this.selectable()) {
      this.toggleRow(row, !this.isSelected(row));
    }
    if (this.togglesDetailOnRow()) this.toggleRowDetail(row);
  }

  private togglesDetailOnRow(): boolean {
    return this.hasRowDetail() && this.rowDetailTrigger() === 'row';
  }

  /* ---------------------------------------------------------------- */
  /* Row detail                                                       */
  /* ---------------------------------------------------------------- */

  isRowExpanded(row: T): boolean {
    return this.expandedKeys().has(String(this.rowKey(row)));
  }

  toggleRowDetail(row: T, event?: Event): void {
    event?.stopPropagation();
    const key = String(this.rowKey(row));
    const next = new Set(this.expandedKeys());
    if (next.has(key)) next.delete(key);
    else next.add(key);
    this.expandedKeys.set(next);
  }

  /** `close` callback handed to the `#ithTableRowDetail` template. */
  rowDetailContext(row: T, index: number): TableRowDetailContext<T> {
    return {
      $implicit: row,
      row,
      index,
      close: () => this.toggleRowDetail(row),
    };
  }

  /* ---------------------------------------------------------------- */
  /* Rendering helpers                                                */
  /* ---------------------------------------------------------------- */

  cellValue(row: T, column: TableColumn<T>): unknown {
    return getPathValue(row, column.field ?? column.key);
  }

  cellText(row: T, column: TableColumn<T>, index = 0): string {
    const value = this.cellValue(row, column);
    const formatted = column.formatter ? column.formatter(value, row, index) : value;
    return toDisplay(formatted);
  }

  cellContext(row: T, column: TableColumn<T>, index: number): TableCellContext<T> {
    return {
      $implicit: row,
      row,
      column,
      value: this.cellValue(row, column),
      index,
    };
  }

  cellTemplate(column: TableColumn<T>): TemplateRef<TableCellContext<T>> | undefined {
    return this.cellTemplates().get(column.key);
  }

  headerTemplate(column: TableColumn<T>): TemplateRef<any> | undefined {
    return this.headerTemplates().get(column.key);
  }

  cellClassFor(row: T, column: TableColumn<T>, index: number) {
    const value =
      typeof column.cellClass === 'function' ? column.cellClass(row, index) : column.cellClass;
    return value ?? '';
  }

  headerClassFor(column: TableColumn<T>): string[] {
    return [this.alignClass(column), column.headerClass ?? ''].filter((value) => !!value);
  }

  /** Flat class list for a header cell (NgClass rejects nested arrays). */
  headerClasses(column: TableColumn<T>): string[] {
    return [
      ...this.headerClassFor(column),
      this.stickyClassFor(column),
      this.dragOverKey() === column.key ? 'ith-table-drop-target' : '',
    ].filter((value) => !!value);
  }

  filterClasses(column: TableColumn<T>): string[] {
    return [this.alignClass(column), this.stickyClassFor(column)].filter((value) => !!value);
  }

  /** Flat class list for a body cell, including dynamic `cellClass` output. */
  cellClasses(row: T, column: TableColumn<T>, index: number): unknown[] {
    const extra = this.cellClassFor(row, column, index);
    const values = Array.isArray(extra) ? extra : [extra];
    return [this.alignClass(column), this.stickyClassFor(column), ...values].filter(
      (value) => !!value,
    );
  }

  columnStyle(column: TableColumn<T>): Record<string, string> {
    const style: Record<string, string> = {};
    const width = this.columnWidths()[column.key];
    if (width) {
      style['width'] = `${width}px`;
      style['min-width'] = `${width}px`;
      style['max-width'] = `${width}px`;
    } else {
      if (column.width) style['width'] = column.width;
      if (column.minWidth) style['min-width'] = column.minWidth;
    }
    const pin = this.pinOf(column);
    if (pin) {
      const offset = this.stickyOffsets().get(column.key);
      if (pin === 'start') style['left'] = `${offset ?? 0}px`;
      else style['right'] = `${offset ?? 0}px`;
    }
    return style;
  }

  /** Runtime pin, falling back to the declared `column.sticky`. */
  pinOf(column: TableColumn<T>): TablePin | null {
    return this.pinnedKeys()[column.key] ?? column.sticky ?? null;
  }

  stickyClassFor(column: TableColumn<T>): string {
    const pin = this.pinOf(column);
    if (pin === 'start') return 'ith-table-sticky-start';
    if (pin === 'end') return 'ith-table-sticky-end';
    return '';
  }

  /**
   * Left/right offsets for stacked sticky columns. Depends on measured widths, so it
   * stays correct for auto-sized and resized columns.
   */
  readonly stickyOffsets = computed(() => {
    const offsets = new Map<string, number>();
    const measured = this.measuredWidths();
    const declared = this.columnWidths();

    const widthOf = (column: TableColumn<T>): number =>
      declared[column.key] ?? measured[column.key] ?? this.declaredWidthPx(column);

    let start = this.selectable() && this.stickySelection() ? 46 : 0;
    for (const column of this.visibleColumns()) {
      if (this.pinOf(column) !== 'start') continue;
      offsets.set(column.key, start);
      start += widthOf(column);
    }

    let end = this.hasActionsColumn() && this.stickyActions() ? this.actionsWidthPx() : 0;
    for (const column of [...this.visibleColumns()].reverse()) {
      if (this.pinOf(column) !== 'end') continue;
      offsets.set(column.key, end);
      end += widthOf(column);
    }

    return offsets;
  });

  /** Full text for the native tooltip; `null` disables it for a column. */
  tooltipText(row: T, column: TableColumn<T>, index: number): string | null {
    if (column.tooltip === false) return null;
    return this.cellText(row, column, index) || null;
  }

  private declaredWidthPx(column: TableColumn<T>): number {
    const width = column.width ?? '';
    if (width.endsWith('px')) return Number.parseFloat(width) || DEFAULT_COLUMN_WIDTH;
    return DEFAULT_COLUMN_WIDTH;
  }

  private actionsWidthPx(): number {
    const width = this.actionsWidth();
    return width.endsWith('px') ? Number.parseFloat(width) || 120 : 120;
  }

  /* ---------------------------------------------------------------- */
  /* Copy / context menu                                              */
  /* ---------------------------------------------------------------- */

  copyCell(row: T, column: TableColumn<T>, index: number, event?: Event): void {
    event?.stopPropagation();
    const value = this.cellText(row, column, index);
    this.copyText(value, `${index}:${column.key}`);
    this.cellCopy.emit({ value, row, index, column });
  }

  copyRow(row: T, index: number, event?: Event): void {
    event?.stopPropagation();
    const value = this.visibleColumns()
      .map((column) => this.cellText(row, column, index))
      .join('\t');
    this.copyText(value, `${index}:__row`);
    this.cellCopy.emit({ value, row, index, column: null });
  }

  isCellCopied(index: number, column: TableColumn<T>): boolean {
    return this.copiedCell() === `${index}:${column.key}`;
  }

  onRowContextMenu(row: T, index: number, event: MouseEvent): void {
    this.rowContextMenu.emit({ row, index, x: event.clientX, y: event.clientY, event });
    if (!this.rowMenuTemplate()) return;
    event.preventDefault();
    this.menuState.set({ row, index, x: event.clientX, y: event.clientY });
  }

  /** Keyboard path for the same menu (context-menu key / Shift+F10). */
  onRowContextMenuKey(row: T, index: number, event: KeyboardEvent): void {
    if (event.key !== 'ContextMenu' && !(event.shiftKey && event.key === 'F10')) return;
    if (!this.rowMenuTemplate()) return;
    event.preventDefault();
    const target = event.target as HTMLElement | null;
    const rect = target?.getBoundingClientRect();
    const x = rect ? rect.left + Math.min(24, rect.width / 2) : 0;
    const y = rect ? rect.bottom : 0;
    this.rowContextMenu.emit({ row, index, x, y, event });
    this.menuState.set({ row, index, x, y });
  }

  closeRowMenu(): void {
    this.menuState.set(null);
  }

  /* ---------------------------------------------------------------- */
  /* Keyboard grid navigation                                         */
  /* ---------------------------------------------------------------- */

  /** `tabindex` of a body cell: one tab stop for the whole grid. */
  cellTabIndex(rowIndex: number, colIndex: number): number | null {
    if (!this.keyboardNavigation()) return this.copyable() ? 0 : null;
    const focused = this.focusedCell();
    if (!focused) return rowIndex === 0 && colIndex === 0 ? 0 : -1;
    return focused.row === rowIndex && focused.col === colIndex ? 0 : -1;
  }

  onCellFocus(rowIndex: number, colIndex: number): void {
    const current = this.focusedCell();
    if (current && current.row === rowIndex && current.col === colIndex) return;
    this.focusedCell.set({ row: rowIndex, col: colIndex });
  }

  /** Copy shortcut plus arrow/Home/End/Page navigation for the cell grid. */
  onCellKeydown(column: TableColumn<T>, rowIndex: number, colIndex: number, event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'c') {
      if (!this.copyable() || isInteractiveTarget(event.target)) return;
      event.preventDefault();
      const row = this.pagedRows()[rowIndex];
      if (row) this.copyCell(row, column, rowIndex);
      return;
    }

    if (!this.keyboardNavigation() || event.altKey) return;
    const rows = this.pagedRows().length;
    const cols = this.visibleColumns().length;
    if (!rows || !cols) return;

    const lastRow = rows - 1;
    const lastCol = cols - 1;
    let row = rowIndex;
    let col = colIndex;

    switch (event.key) {
      case 'ArrowUp':
        row = Math.max(0, rowIndex - 1);
        break;
      case 'ArrowDown':
        row = Math.min(lastRow, rowIndex + 1);
        break;
      case 'ArrowLeft':
        col = Math.max(0, colIndex - 1);
        break;
      case 'ArrowRight':
        col = Math.min(lastCol, colIndex + 1);
        break;
      case 'Home':
        if (event.ctrlKey || event.metaKey) {
          row = 0;
          col = 0;
        } else {
          col = 0;
        }
        break;
      case 'End':
        if (event.ctrlKey || event.metaKey) {
          row = lastRow;
          col = lastCol;
        } else {
          col = lastCol;
        }
        break;
      case 'PageUp':
        row = Math.max(0, rowIndex - this.pageSize());
        break;
      case 'PageDown':
        row = Math.min(lastRow, rowIndex + this.pageSize());
        break;
      case ' ':
      case 'Spacebar': {
        const target = this.pagedRows()[rowIndex];
        if (!target || !this.selectable() || isInteractiveTarget(event.target)) return;
        event.preventDefault();
        this.toggleRow(target, !this.isSelected(target));
        return;
      }
      default:
        return;
    }

    event.preventDefault();
    if (row === rowIndex && col === colIndex) return;
    this.focusCell(row, col);
  }

  /** Move DOM focus to a cell, updating the single tab stop. */
  private focusCell(row: number, col: number): void {
    this.focusedCell.set({ row, col });
    const target = this.host.nativeElement.querySelector<HTMLElement>(
      `[data-cell="${row}-${col}"]`,
    );
    target?.focus();
  }

  /* ---------------------------------------------------------------- */
  /* Column preset / density                                          */
  /* ---------------------------------------------------------------- */

  isColumnVisible(column: TableColumn<T>): boolean {
    return !column.hidden && !this.hiddenColumnKeys().has(column.key);
  }

  setColumnVisible(key: string, visible: boolean): void {
    const next = new Set(this.hiddenColumnKeys());
    if (visible) next.delete(key);
    else if (!this.canHide(key)) return;
    else next.add(key);

    // Never hide every column: keep at least one visible.
    const visibleCount = this.columns().filter(
      (column) => !column.hidden && !next.has(column.key),
    ).length;
    if (visibleCount === 0) return;

    this.hiddenColumnKeys.set(next);
    this.emitColumns();
  }

  resetColumns(): void {
    this.hiddenColumnKeys.set(new Set());
    this.columnOrder.set([]);
    this.columnWidths.set({});
    this.pinnedKeys.set({});
    this.emitColumns();
  }

  /** A column can be hidden when it is hideable and at least one other stays visible. */
  canHide(key: string): boolean {
    const column = this.columns().find((candidate) => candidate.key === key);
    if (column?.hideable === false) return false;
    return this.visibleColumns().length > 1;
  }

  private emitColumns(): void {
    this.columnsChange.emit(this.visibleColumns().map((column) => column.key));
    this.columnStateChange.emit(this.state());
  }

  toggleColumnPicker(event?: Event): void {
    event?.stopPropagation();
    if (this.columnPickerOpen()) {
      this.columnPickerOpen.set(false);
      return;
    }
    const anchor = event?.currentTarget;
    if (anchor instanceof HTMLElement) {
      this.columnsMenuPos.set(this.floatPosition(anchor, 250, 380));
    }
    this.columnPickerOpen.set(true);
    this.viewsOpen.set(false);
    this.columnMenu.set(null);
  }

  toggleViews(event?: Event): void {
    event?.stopPropagation();
    if (this.viewsOpen()) {
      this.viewsOpen.set(false);
      return;
    }
    const anchor = event?.currentTarget;
    if (anchor instanceof HTMLElement) {
      this.viewsMenuPos.set(this.floatPosition(anchor, 260, 340));
    }
    this.viewsOpen.set(true);
    this.columnPickerOpen.set(false);
    this.columnMenu.set(null);
  }

  /** Set the row density explicitly (the toolbar segmented control). */
  setDensity(density: TableDensity): void {
    if (this.density() === density) return;
    this.density.set(density);
    this.densityChange.emit(density);
  }

  toggleDensity(): void {
    this.setDensity(this.density() === 'compact' ? 'comfortable' : 'compact');
  }

  /* ---- header menu ------------------------------------------------- */

  openColumnMenu(column: TableColumn<T>, event: Event): void {
    event.stopPropagation();
    const anchor = event.currentTarget;
    if (!(anchor instanceof HTMLElement)) return;
    if (this.columnMenu()?.key === column.key) {
      this.columnMenu.set(null);
      return;
    }
    const position = this.floatPosition(anchor, 220, 300);
    this.columnMenu.set({ key: column.key, ...position });
    this.columnPickerOpen.set(false);
    this.viewsOpen.set(false);
  }

  columnMenuColumn(): TableColumn<T> | undefined {
    const menu = this.columnMenu();
    return menu ? this.columns().find((column) => column.key === menu.key) : undefined;
  }

  closeColumnMenu(): void {
    this.columnMenu.set(null);
  }

  menuSort(direction: TableSortDirection): void {
    const column = this.columnMenuColumn();
    if (column) this.sort.set({ key: column.key, direction });
    this.closeColumnMenu();
  }

  menuClearSort(): void {
    this.sort.set(null);
    this.closeColumnMenu();
  }

  menuPin(pin: TablePin | null): void {
    const column = this.columnMenuColumn();
    if (column) this.pinColumn(column.key, pin);
    this.closeColumnMenu();
  }

  menuHide(): void {
    const column = this.columnMenuColumn();
    if (column) this.setColumnVisible(column.key, false);
    this.closeColumnMenu();
  }

  menuAutosize(): void {
    const column = this.columnMenuColumn();
    if (column) this.autosizeColumn(column.key);
    this.closeColumnMenu();
  }

  canPin(column: TableColumn<T>): boolean {
    return column.pinnable !== false;
  }

  pinColumn(key: string, pin: TablePin | null): void {
    const next = { ...this.pinnedKeys() };
    if (pin) next[key] = pin;
    else delete next[key];
    this.pinnedKeys.set(next);
    this.emitColumns();
  }

  /* ---- resize ------------------------------------------------------ */

  startResize(column: TableColumn<T>, event: PointerEvent): void {
    if (!this.resizable()) return;
    event.preventDefault();
    event.stopPropagation();
    const header = (event.target as HTMLElement).closest('th');
    const startWidth = header?.getBoundingClientRect().width ?? this.declaredWidthPx(column);
    this.resizing = { key: column.key, startX: event.clientX, startWidth };
    document.body.style.userSelect = 'none';
  }

  @HostListener('document:pointermove', ['$event'])
  onDocumentPointerMove(event: PointerEvent): void {
    if (!this.resizing) return;
    const width = Math.max(
      MIN_COLUMN_WIDTH,
      Math.round(this.resizing.startWidth + event.clientX - this.resizing.startX),
    );
    this.columnWidths.set({ ...this.columnWidths(), [this.resizing.key]: width });
  }

  @HostListener('document:pointerup')
  onDocumentPointerUp(): void {
    if (!this.resizing) return;
    this.resizing = null;
    document.body.style.userSelect = '';
    this.scheduleMeasure();
    this.columnStateChange.emit(this.state());
  }

  /** Shrink/grow a column to its widest rendered value. */
  autosizeColumn(key: string): void {
    const column = this.visibleColumns().find((candidate) => candidate.key === key);
    if (!column) return;
    const header = String(column.header ?? column.key);
    const widths = this.pagedRows().map((row, index) =>
      this.cellText(row, column, index).length,
    );
    const longest = Math.max(header.length, ...widths, 4);
    const width = Math.min(460, Math.max(MIN_COLUMN_WIDTH, Math.round(longest * 7.6) + 46));
    this.columnWidths.set({ ...this.columnWidths(), [key]: width });
    this.columnStateChange.emit(this.state());
  }

  /* ---- reorder ----------------------------------------------------- */

  onHeaderDragStart(column: TableColumn<T>, event: DragEvent): void {
    if (!this.reorderable()) {
      event.preventDefault();
      return;
    }
    this.dragKey.set(column.key);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', column.key);
    }
  }

  onHeaderDragOver(column: TableColumn<T>, event: DragEvent): void {
    if (!this.reorderable() || !this.dragKey()) return;
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
    if (this.dragOverKey() !== column.key) this.dragOverKey.set(column.key);
  }

  onHeaderDrop(column: TableColumn<T>, event: DragEvent): void {
    if (!this.reorderable()) return;
    event.preventDefault();
    const from = this.dragKey();
    this.dragKey.set(null);
    this.dragOverKey.set(null);
    if (!from || from === column.key) return;
    this.moveColumn(from, column.key);
  }

  onHeaderDragEnd(): void {
    this.dragKey.set(null);
    this.dragOverKey.set(null);
  }

  /** Move `from` onto the slot of `to`, keeping hidden columns in the list. */
  moveColumn(from: string, to: string): void {
    const order = this.orderedColumns().map((column) => column.key);
    const fromIndex = order.indexOf(from);
    const toIndex = order.indexOf(to);
    if (fromIndex < 0 || toIndex < 0) return;
    order.splice(fromIndex, 1);
    order.splice(toIndex, 0, from);
    this.columnOrder.set(order);
    this.emitColumns();
  }

  /* ---------------------------------------------------------------- */
  /* Export                                                           */
  /* ---------------------------------------------------------------- */

  /** Rows an export writes: the selection when there is one, else every match. */
  exportRows(): T[] {
    return this.selected().length ? this.selected() : this.sortedRows();
  }

  toggleExportMenu(event?: Event): void {
    event?.stopPropagation();
    if (this.exportMenuPos()) {
      this.exportMenuPos.set(null);
      return;
    }
    const anchor = event?.currentTarget;
    this.exportMenuPos.set(
      anchor instanceof HTMLElement ? this.floatPosition(anchor, 210, 170) : { x: 8, y: 8 },
    );
    this.columnPickerOpen.set(false);
    this.viewsOpen.set(false);
    this.columnMenu.set(null);
  }

  exportAs(format: 'csv' | 'xlsx'): void {
    this.exportMenuPos.set(null);
    if (format === 'xlsx') this.downloadExcel();
    else this.downloadCsv();
  }

  /** CSV text of the current view: selected rows when there are any, else all matches. */
  toCsv(): string {
    const columns = this.visibleColumns();
    const rows = this.exportRows();
    const escapeValue = (value: string): string =>
      /[",;\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;

    const header = columns.map((column) => escapeValue(String(column.header ?? column.key)));
    const body = rows.map((row, index) =>
      columns.map((column) => escapeValue(this.cellText(row, column, index))).join(','),
    );
    return [header.join(','), ...body].join('\r\n');
  }

  /** Download the current view as a UTF-8 CSV file. */
  downloadCsv(): void {
    const csv = this.toCsv();
    this.csvExport.emit(csv);
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    this.saveFile(blob, `${this.exportFileName()}.csv`, 'csv');
  }

  /** Real Excel workbook (`.xlsx`) of the current view, built without dependencies. */
  toExcel(): Blob {
    const columns = this.visibleColumns();
    const rows = this.exportRows();
    return buildXlsxBlob({
      sheetName: this.title() || 'Data',
      header: columns.map((column) => String(column.header ?? column.key)),
      rows: rows.map((row, index) =>
        columns.map((column) => this.cellText(row, column, index)),
      ),
    });
  }

  /** Download the current view as an `.xlsx` workbook. */
  downloadExcel(): void {
    this.saveFile(this.toExcel(), `${this.exportFileName()}.xlsx`, 'xlsx');
  }

  private saveFile(blob: Blob, fileName: string, format: 'csv' | 'xlsx'): void {
    this.exportFile.emit({ format, fileName, blob, rows: this.exportRows() });
    if (typeof document === 'undefined' || typeof URL === 'undefined') return;

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  /* ---------------------------------------------------------------- */
  /* Aggregates                                                       */
  /* ---------------------------------------------------------------- */

  /** Footer cell text for a column that declares an `aggregate`. */
  aggregateText(column: TableColumn<T>): string {
    if (!column.aggregate) return '';
    const aggregate: TableAggregate<T> =
      typeof column.aggregate === 'string' ? { type: column.aggregate } : column.aggregate;
    const rows = this.isServer() ? this.data() : this.sortedRows();

    if (aggregate.type === 'count') {
      return String(rows.length);
    }

    const numbers = rows
      .map((row) => Number(this.cellValue(row, column)))
      .filter((value) => Number.isFinite(value));
    if (!numbers.length) return '';

    let value = 0;
    switch (aggregate.type) {
      case 'sum':
        value = numbers.reduce((total, next) => total + next, 0);
        break;
      case 'avg':
        value = numbers.reduce((total, next) => total + next, 0) / numbers.length;
        break;
      case 'min':
        value = Math.min(...numbers);
        break;
      case 'max':
        value = Math.max(...numbers);
        break;
    }

    if (aggregate.format) return aggregate.format(value, column);
    return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }

  aggregateLabel(column: TableColumn<T>): string {
    if (!column.aggregate) return '';
    if (typeof column.aggregate !== 'string' && column.aggregate.label) {
      return column.aggregate.label;
    }
    const type: TableAggregateType =
      typeof column.aggregate === 'string' ? column.aggregate : column.aggregate.type;
    return type;
  }

  /* ---------------------------------------------------------------- */
  /* Named views                                                      */
  /* ---------------------------------------------------------------- */

  applyView(name: string): void {
    const view = this.views()[name];
    if (!view) return;
    this.applyState(view);
    this.activeView.set(name);
    this.viewsOpen.set(false);
    this.emitColumns();
  }

  saveView(): void {
    const name = this.viewNameDraft().trim();
    if (!name) return;
    this.views.set({ ...this.views(), [name]: this.state() });
    this.activeView.set(name);
    this.viewNameDraft.set('');
  }

  deleteView(name: string, event: MouseEvent): void {
    event.stopPropagation();
    const next = { ...this.views() };
    delete next[name];
    this.views.set(next);
    if (this.activeView() === name) this.activeView.set(null);
  }

  onViewNameInput(value: string): void {
    this.viewNameDraft.set(value);
  }

  /* ---------------------------------------------------------------- */
  /* Scroll                                                           */
  /* ---------------------------------------------------------------- */

  onScroll(event: Event): void {
    const target = event.target as HTMLElement;
    const scrolled = target.scrollTop > 0;
    if (scrolled !== this.scrolled()) this.scrolled.set(scrolled);
  }

  /* ---------------------------------------------------------------- */
  /* Internals                                                        */
  /* ---------------------------------------------------------------- */

  private copyText(value: string, key: string): void {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(value).catch(() => undefined);
    }
    this.copiedCell.set(key);
    if (this.copyTimer) clearTimeout(this.copyTimer);
    this.copyTimer = setTimeout(() => this.copiedCell.set(null), 1400);
  }

  /** Screen position for a menu anchored to `anchor`, kept inside the viewport. */
  private floatPosition(anchor: HTMLElement, width: number, height: number): FloatingPosition {
    const rect = anchor.getBoundingClientRect();
    const viewportWidth = typeof window === 'undefined' ? 1280 : window.innerWidth;
    const viewportHeight = typeof window === 'undefined' ? 800 : window.innerHeight;
    const x = Math.min(Math.max(8, rect.right - width), Math.max(8, viewportWidth - width - 8));
    const y = Math.min(rect.bottom + 6, Math.max(8, viewportHeight - height - 8));
    return { x, y };
  }

  /** Read header widths so stacked sticky columns line up. */
  private measureHeaderWidths(): void {
    const headers = this.host.nativeElement.querySelectorAll<HTMLElement>('th[data-col]');
    if (!headers.length) return;
    const next: Record<string, number> = {};
    headers.forEach((header) => {
      const key = header.dataset['col'];
      if (!key) return;
      const width = Math.round(header.getBoundingClientRect().width);
      if (width > 0) next[key] = width;
    });
    const current = this.measuredWidths();
    const keys = Object.keys(next);
    const changed =
      keys.length !== Object.keys(current).length ||
      keys.some((key) => Math.abs((current[key] ?? 0) - next[key]) > 0.5);
    if (changed) this.measuredWidths.set(next);
  }

  private scheduleMeasure(): void {
    if (typeof requestAnimationFrame === 'undefined') return;
    if (this.measureHandle) cancelAnimationFrame(this.measureHandle);
    this.measureHandle = requestAnimationFrame(() => {
      this.measureHandle = undefined;
      this.measureHeaderWidths();
    });
  }

  private applyState(state: Partial<TablePresetState> | null | undefined): void {
    if (!state) return;
    if (Array.isArray(state.hidden)) this.hiddenColumnKeys.set(new Set(state.hidden));
    if (state.density === 'compact' || state.density === 'comfortable') {
      this.density.set(state.density);
    }
    if (Array.isArray(state.order)) this.columnOrder.set([...state.order]);
    if (state.widths && typeof state.widths === 'object') {
      this.columnWidths.set({ ...state.widths });
    }
    if (state.pinned && typeof state.pinned === 'object') {
      this.pinnedKeys.set({ ...state.pinned });
    }
  }

  private readPreset(key: string): {
    state: TablePresetState | null;
    views: Record<string, TablePresetState>;
    activeView: string | null;
  } | null {
    if (!key || typeof localStorage === 'undefined') return null;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as {
        v?: number;
        state?: TablePresetState;
        views?: Record<string, TablePresetState>;
        activeView?: string | null;
        /** Legacy (v1) shape. */
        hidden?: string[];
        density?: TableDensity;
      };
      if (parsed.state) {
        return {
          state: parsed.state,
          views: parsed.views ?? {},
          activeView: parsed.activeView ?? null,
        };
      }
      return {
        state: {
          hidden: Array.isArray(parsed.hidden) ? parsed.hidden : [],
          density: parsed.density === 'compact' ? 'compact' : 'comfortable',
          order: [],
          widths: {},
          pinned: {},
        },
        views: {},
        activeView: null,
      };
    } catch {
      return null;
    }
  }

  private persistPreset(key: string): void {
    if (!key || typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(
        key,
        JSON.stringify({
          v: 2,
          state: this.state(),
          views: this.views(),
          activeView: this.activeView(),
        }),
      );
    } catch {
      // Storage disabled (private mode) — the preset simply stays in memory.
    }
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.closeRowMenu();
    this.columnPickerOpen.set(false);
    this.viewsOpen.set(false);
    this.columnMenu.set(null);
    this.exportMenuPos.set(null);
  }

  @HostListener('document:keydown.escape')
  onDocumentEscape(): void {
    this.onDocumentClick();
  }

  alignClass(column: TableColumn<T>): string {
    return column.align ? `ith-table-align-${column.align}` : '';
  }

  rowClassFor(row: T, index: number) {
    return [this.isSelected(row) ? 'ith-table-row-selected' : '', this.rowClass()?.(row, index) ?? ''];
  }

  trackRow(index: number, row: T): unknown {
    return this.rowKey(row) ?? index;
  }

  toolbarContext(): Record<string, unknown> {
    return {
      $implicit: this.pagedRows(),
      rows: this.pagedRows(),
      total: this.totalRows(),
      selected: this.selected(),
      search: this.search(),
    };
  }

  footerContext(): Record<string, unknown> {
    return {
      ...this.toolbarContext(),
      page: this.page(),
      pageSize: this.pageSize(),
      pageCount: this.pageCount(),
    };
  }

  emptyContext(): Record<string, unknown> {
    return { ...this.toolbarContext() };
  }

  private compareRows(a: T, b: T, column: TableColumn<T>): number {
    if (column.sortFn) return column.sortFn(a, b);
    const path = column.field ?? column.key;
    return defaultCompare(getPathValue(a, path), getPathValue(b, path));
  }

  /** Match one row against the current filter value of one column. */
  private columnMatchesFilter(row: T, column: TableColumn<T>, term: string): boolean {
    const raw = this.cellValue(row, column);
    const value = term.trim();

    // A column-level predicate always wins; it gets the raw value and raw term.
    if (column.filterPredicate) return column.filterPredicate(raw, term, row);

    switch (this.filterTypeFor(column)) {
      case 'select':
        return String(raw ?? '') === value;
      case 'number': {
        const number = Number(raw);
        const typed = Number(value);
        return value !== '' && Number.isFinite(number) && Number.isFinite(typed) && number === typed;
      }
      case 'date': {
        // ISO strings (`2026-10-05`, `2026-10-05T23:00:00Z`) are compared by their
        // calendar date, so a time zone can never shift the day.
        if (typeof raw === 'string') {
          const isoDate = /^(\d{4}-\d{2}-\d{2})/.exec(raw);
          if (isoDate) return isoDate[1] === value;
        }
        const date = raw instanceof Date ? raw : new Date(String(raw));
        if (Number.isNaN(date.getTime())) return this.filterText(row, column).includes(value.toLowerCase());
        const pad = (part: number): string => String(part).padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` === value;
      }
      default:
        return this.filterText(row, column).includes(value.toLowerCase());
    }
  }

  private searchText(row: T, column: TableColumn<T>): string {
    if (column.searchValue) return column.searchValue(row).toLowerCase();
    return this.cellText(row, column).toLowerCase();
  }

  private filterText(row: T, column: TableColumn<T>): string {
    if (column.filterValue) return column.filterValue(row).toLowerCase();
    return this.cellText(row, column).toLowerCase();
  }
}
