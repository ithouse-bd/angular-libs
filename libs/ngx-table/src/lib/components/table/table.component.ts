import { NgClass, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  contentChildren,
  effect,
  input,
  model,
  output,
  untracked,
} from '@angular/core';

import {
  TableCellDirective,
  TableEmptyDirective,
  TableFilterDirective,
  TableFooterDirective,
  TableHeaderDirective,
  TableRowActionsDirective,
  TableToolbarDirective,
} from '../../directives/table-template.directives';
import {
  TableActionEvent,
  TableCellContext,
  TableColumn,
  TableFilterContext,
  TableFilterOption,
  TableFilterType,
  TableMode,
  TableRowAction,
  TableRowEvent,
  TableSelectAllScope,
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

let tableIdCounter = 0;

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
  // are imported by the consumer (or via `NgxTableModule`), not declared here.
  imports: [NgClass, NgTemplateOutlet],
  templateUrl: './table.component.html',
  styleUrl: './table.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableComponent<T = any> {
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

  /* ---------------------------------------------------------------- */
  /* Selection                                                        */
  /* ---------------------------------------------------------------- */

  readonly selectionMode = input<TableSelectionMode>('none');
  readonly selectAllScope = input<TableSelectAllScope>('page');
  /** Selected rows, two-way bindable. */
  readonly selected = model<T[]>([]);
  /** Selecting a row by clicking anywhere on it (not only the checkbox). */
  readonly selectOnRowClick = input<boolean>(false);

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
  /* Events                                                           */
  /* ---------------------------------------------------------------- */

  readonly actionClick = output<TableActionEvent<T>>();
  readonly rowClick = output<TableRowEvent<T>>();

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

  /* ---------------------------------------------------------------- */
  /* Internal state                                                   */
  /* ---------------------------------------------------------------- */

  readonly filters = model<Record<string, string>>({});
  private skipInitialReset = true;

  constructor() {
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
  }

  /* ---------------------------------------------------------------- */
  /* Derived data                                                     */
  /* ---------------------------------------------------------------- */

  readonly isServer = computed(() => this.mode() === 'server');

  readonly visibleColumns = computed(() => this.columns().filter((column) => !column.hidden));

  readonly selectable = computed(() => this.selectionMode() !== 'none');

  readonly hasActionsColumn = computed(
    () => this.rowActions().length > 0 || !!this.rowActionsTemplate(),
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

  readonly emptyColspan = computed(() =>
    Math.max(
      1,
      this.visibleColumns().length + (this.selectable() ? 1 : 0) + (this.hasActionsColumn() ? 1 : 0),
    ),
  );

  readonly hasQuery = computed(
    () =>
      this.search().trim() !== '' ||
      Object.values(this.filters()).some((value) => value.trim() !== ''),
  );

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

  filterOptionsFor(column: TableColumn<T>): TableFilterOption[] {
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
    if (event.key !== 'Enter' && event.key !== ' ') return;
    if (isInteractiveTarget(event.target)) return;
    if (!this.rowClickable() && !this.selectOnRowClick()) return;
    event.preventDefault();
    this.activateRow(row, index, event);
  }

  /** Shared by mouse and keyboard activation. */
  private activateRow(row: T, index: number, event: Event): void {
    this.rowClick.emit({ row, index, event });
    if (this.selectOnRowClick() && this.selectable()) {
      this.toggleRow(row, !this.isSelected(row));
    }
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

  columnStyle(column: TableColumn<T>): Record<string, string> {
    const style: Record<string, string> = {};
    if (column.width) style['width'] = column.width;
    if (column.minWidth) style['min-width'] = column.minWidth;
    return style;
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

  /* ---------------------------------------------------------------- */
  /* Internals                                                        */
  /* ---------------------------------------------------------------- */

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
