import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  model,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import {
  CascaderChangeEvent,
  CascaderChildrenLoader,
  CascaderOption,
  CascaderSearchFn,
  CascaderSearchResult,
  CascaderValueResolver,
} from '../../models/cascader.models';

let cascaderIdCounter = 0;

function isThenable<T>(value: unknown): value is PromiseLike<T> {
  return !!value && typeof (value as PromiseLike<unknown>).then === 'function';
}

function isSubscribable<T>(
  value: unknown,
): value is { subscribe: (observer: any) => { unsubscribe?: () => void } } {
  return !!value && typeof (value as { subscribe?: unknown }).subscribe === 'function';
}

/**
 * Hierarchical / cascading select: pick a path through nested options
 * (division → district → sub-district, category → sub-category, …).
 *
 * ```html
 * <ith-cascader
 *   [options]="areas"
 *   placeholder="Select delivery area"
 *   [(value)]="area">
 * </ith-cascader>
 * ```
 *
 * The dropdown is drill-down based: clicking a node with `children` opens the next
 * level, leaf nodes select a value. A breadcrumb shows where you are and search scans
 * the whole tree, showing the full path for each hit.
 */
@Component({
  selector: 'ith-cascader',
  templateUrl: './cascader.component.html',
  styleUrls: ['./cascader.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CascaderComponent),
      multi: true,
    },
  ],
})
export class CascaderComponent implements ControlValueAccessor {
  /* ---------------------------------------------------------------- */
  /* Inputs                                                           */
  /* ---------------------------------------------------------------- */

  /** Root nodes of the tree. */
  readonly options = input<CascaderOption[]>([]);
  readonly placeholder = input<string>('Select...');
  readonly searchable = input<boolean>(true);
  readonly disabled = input<boolean>(false);
  readonly clearable = input<boolean>(true);
  /** Allow selecting a node that also has children (not only leaves). */
  readonly changeOnSelect = input<boolean>(false);
  /** Close the panel after a value is chosen. */
  readonly closeOnSelect = input<boolean>(true);
  /** CSS max-height of the option list. */
  readonly maxHeight = input<string>('300px');
  readonly searchPlaceholder = input<string>('Search...');
  readonly noOptionsText = input<string>('No options found');
  /** Label of the root crumb in the panel breadcrumb. */
  readonly rootLabel = input<string>('All');
  /** Separator used between levels in the trigger and in search results. */
  readonly pathSeparator = input<string>(' > ');
  /** Property used as the label (defaults to `label`, then `name`, then `value`). */
  readonly bindLabel = input<string | undefined>(undefined);
  /** Property used as the value (defaults to `value`, else the whole node). */
  readonly bindValue = input<string | undefined>(undefined);
  /** Property that holds the child array (defaults to `children`). */
  readonly bindChildren = input<string>('children');
  /** Accessible name of the control. */
  readonly ariaLabel = input<string>('Cascading select');

  /**
   * Load one level on demand instead of shipping the whole tree (API calls).
   * Return a `Promise` or an RxJS-style observable; results are cached per node.
   */
  readonly loadChildren = input<CascaderChildrenLoader | undefined>(undefined);
  /**
   * Placeholder for each level, e.g. `['Select Division', 'Select District', 'Select Sub-district']`.
   * The first entry is used by the closed control, and the current level's entry is shown
   * as a hint above the list while drilling. The last entry is reused for deeper levels.
   */
  readonly levelPlaceholders = input<string[]>([]);
  readonly loadingText = input<string>('Loading...');
  readonly loadErrorText = input<string>('Could not load options');
  readonly retryText = input<string>('Retry');
  /**
   * Resolve the label path of a value that is not in the loaded tree yet — used when a
   * form binds an existing value (edit mode). Accepts a `Promise` or RxJS observable
   * returning the root→leaf path, e.g. `(id) => http.get<CascaderOption[]>(`/areas/${id}/path`)`.
   */
  readonly resolveValue = input<CascaderValueResolver | undefined>(undefined);
  /**
   * Server-side search. When set, typing queries the API (after `searchDebounce` ms)
   * instead of walking the loaded tree; every hit carries its full path.
   */
  readonly searchFn = input<CascaderSearchFn | undefined>(undefined);
  readonly searchDebounce = input<number>(300);
  readonly searchMinLength = input<number>(1);
  readonly searchingText = input<string>('Searching...');
  readonly searchErrorText = input<string>('Search failed');

  /* ---------------------------------------------------------------- */
  /* Outputs                                                          */
  /* ---------------------------------------------------------------- */

  /** Selected leaf value; two-way bindable. */
  readonly value = model<any>(null);
  readonly selectionChange = output<CascaderChangeEvent>();
  readonly openChange = output<boolean>();
  readonly searchChange = output<string>();

  /* ---------------------------------------------------------------- */
  /* Internal state                                                   */
  /* ---------------------------------------------------------------- */

  readonly isOpen = signal(false);
  readonly searchTerm = signal('');
  /** Nodes the user has drilled into, from the root downwards. */
  readonly drillPath = signal<CascaderOption[]>([]);
  /** Index into `visibleItems()` of the keyboard-highlighted row (-1 = none). */
  readonly activeIndex = signal(-1);

  private readonly formDisabled = signal(false);
  /** Children fetched through `loadChildren`, keyed by the node's path. */
  private readonly childrenCache = signal(new Map<string, CascaderOption[]>());
  private readonly loadingKeys = signal(new Set<string>());
  private readonly errorKeys = signal(new Map<string, string>());
  /** Path returned by `resolveValue` for a value whose branch is not loaded. */
  private readonly hydratedPath = signal<CascaderOption[]>([]);
  private readonly resolvingValue = signal(false);
  private lastResolvedKey: string | null = null;

  /** Hits returned by `searchFn`. */
  private readonly remoteResults = signal<CascaderSearchResult[]>([]);
  private readonly remoteSearching = signal(false);
  private readonly remoteSearchError = signal<string | null>(null);
  private searchTimer: ReturnType<typeof setTimeout> | null = null;
  /** Invalidates in-flight requests when the term changes again. */
  private searchToken = 0;
  private readonly destroyRef = inject(DestroyRef);

  readonly idBase = `ith-cascader-${cascaderIdCounter++}`;
  readonly panelId = `${this.idBase}-panel`;
  readonly listId = `${this.idBase}-list`;

  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');
  private readonly listBox = viewChild<ElementRef<HTMLElement>>('listBox');
  private readonly trigger = viewChild<ElementRef<HTMLButtonElement>>('trigger');

  private onChangeFn: (value: any) => void = () => {};
  private onTouchedFn: () => void = () => {};
  private lastFormValue: any = null;

  constructor(private readonly elementRef: ElementRef<HTMLElement>) {
    // Mirror value changes into the bound form control without echoing back a value
    // that the form itself just pushed in (same approach as `ith-dropdown`).
    effect(() => {
      const v = this.value();
      if (v === this.lastFormValue) return;
      this.onChangeFn(v);
    });

    // Edit mode: hydrate the label path for a bound value whose branch is not loaded.
    effect(() => {
      const value = this.value();
      const resolver = this.resolveValue();
      const key = `${resolver ? 'r' : '-'}|${JSON.stringify(value) ?? 'null'}`;
      if (key === this.lastResolvedKey) return;
      this.lastResolvedKey = key;

      untracked(() => {
        // A path we already know (e.g. a server search hit) is kept as-is.
        const hydrated = this.hydratedPath();
        if (
          hydrated.length &&
          this.sameValue(this.valueOf(hydrated[hydrated.length - 1]), value)
        ) {
          return;
        }
        this.hydratePath(value, resolver);
      });
    });

    // Debounced server-side search.
    effect(() => {
      const term = this.searchTerm();
      const fn = this.searchFn();
      const delay = this.searchDebounce();
      const minLength = this.searchMinLength();
      untracked(() => this.scheduleSearch(term, fn, delay, minLength));
    });

    this.destroyRef.onDestroy(() => {
      this.searchToken++;
      if (this.searchTimer) clearTimeout(this.searchTimer);
    });
  }

  /* ---------------------------------------------------------------- */
  /* Server-side search                                                */
  /* ---------------------------------------------------------------- */

  /** `true` when searching is delegated to `searchFn`. */
  readonly isRemoteSearch = computed(() => !!this.searchFn());
  /** `true` while the debounced query is pending or in flight. */
  readonly searchLoading = computed(() => this.isSearching() && this.remoteSearching());
  readonly searchError = computed(() =>
    this.isSearching() ? this.remoteSearchError() : null,
  );

  /** Re-run the current query immediately (after a failed request). */
  retrySearch(): void {
    const fn = this.searchFn();
    const term = this.searchTerm().trim();
    if (!fn || !term) return;
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
      this.searchTimer = null;
    }
    const token = ++this.searchToken;
    this.remoteSearching.set(true);
    this.remoteSearchError.set(null);
    this.executeSearch(term, fn, token);
  }

  private scheduleSearch(
    term: string,
    fn: CascaderSearchFn | undefined,
    delay: number,
    minLength: number,
  ): void {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
      this.searchTimer = null;
    }

    const token = ++this.searchToken;
    const query = term.trim();
    const tooShort = !!fn && query.length > 0 && query.length < minLength;

    if (!fn || !query || tooShort) {
      this.remoteResults.set([]);
      this.remoteSearching.set(false);
      this.remoteSearchError.set(null);
      return;
    }

    this.remoteSearching.set(true);
    this.remoteSearchError.set(null);

    this.searchTimer = setTimeout(() => {
      this.searchTimer = null;
      if (token !== this.searchToken) return;
      this.executeSearch(query, fn, token);
    }, Math.max(0, delay));
  }

  private executeSearch(query: string, fn: CascaderSearchFn, token: number): void {
    const done = (results: CascaderSearchResult[]): void => {
      if (token !== this.searchToken) return;
      this.remoteResults.set(Array.isArray(results) ? results : []);
      this.remoteSearching.set(false);
      this.remoteSearchError.set(null);
      this.activeIndex.set(-1);
    };

    const fail = (error?: unknown): void => {
      if (token !== this.searchToken) return;
      this.remoteResults.set([]);
      this.remoteSearching.set(false);
      this.remoteSearchError.set(
        error instanceof Error && error.message ? error.message : this.searchErrorText(),
      );
    };

    try {
      const result: unknown = fn(query);
      if (isThenable<CascaderSearchResult[]>(result)) {
        (result as Promise<CascaderSearchResult[]>).then(done).catch(fail);
      } else if (isSubscribable<CascaderSearchResult[]>(result)) {
        let subscription: { unsubscribe?: () => void } | undefined;
        subscription = result.subscribe({
          next: (hits: CascaderSearchResult[]) => {
            done(hits ?? []);
            subscription?.unsubscribe?.();
          },
          error: fail,
        });
      } else if (Array.isArray(result)) {
        done(result as CascaderSearchResult[]);
      } else {
        fail();
      }
    } catch (error) {
      fail(error);
    }
  }

  /* ---------------------------------------------------------------- */
  /* Value hydration (edit mode)                                      */
  /* ---------------------------------------------------------------- */

  private hydratePath(value: any, resolver: CascaderValueResolver | undefined): void {
    this.hydratedPath.set([]);
    this.resolvingValue.set(false);

    const empty = value === null || value === undefined || value === '';
    if (empty || !resolver) return;
    // Already resolvable from the loaded tree — nothing to fetch.
    if (this.resolvePath(value).length) return;

    this.resolvingValue.set(true);
    let settled = false;

    const done = (path: CascaderOption[]): void => {
      if (settled) return;
      settled = true;
      this.resolvingValue.set(false);
      // Ignore an answer that arrives after the value changed again.
      if (!Array.isArray(path) || !path.length) return;
      if (!this.sameValue(this.valueOf(path[path.length - 1]), this.value())) return;
      this.hydratedPath.set(path);
    };

    const fail = (): void => {
      if (settled) return;
      settled = true;
      this.resolvingValue.set(false);
    };

    try {
      const result: unknown = resolver(value);
      if (isThenable<CascaderOption[]>(result)) {
        (result as Promise<CascaderOption[]>).then(done).catch(fail);
      } else if (isSubscribable<CascaderOption[]>(result)) {
        let subscription: { unsubscribe?: () => void } | undefined;
        subscription = result.subscribe({
          next: (path: CascaderOption[]) => {
            done(path ?? []);
            subscription?.unsubscribe?.();
          },
          error: fail,
        });
      } else if (Array.isArray(result)) {
        done(result as CascaderOption[]);
      } else {
        fail();
      }
    } catch {
      fail();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target as Node)) this.close();
  }

  /* ---------------------------------------------------------------- */
  /* Derived state                                                    */
  /* ---------------------------------------------------------------- */

  readonly isDisabled = computed(() => this.disabled() || this.formDisabled());

  readonly isSearching = computed(
    () => this.searchable() && this.searchTerm().trim() !== '',
  );

  /** Children of the deepest drilled node (static or fetched), or the root options. */
  readonly currentLevel = computed<CascaderOption[]>(() => {
    const path = this.drillPath();
    if (!path.length) return this.options();
    return this.childrenFor(path[path.length - 1], path);
  });

  /** `true` while `resolveValue` is fetching the path of a bound value. */
  readonly isResolvingValue = computed(() => this.resolvingValue());

  /** `true` while the current level is being fetched. */
  readonly isLoading = computed(() => {
    const path = this.drillPath();
    return path.length > 0 && this.loadingKeys().has(this.pathKey(path));
  });

  /** Error message for the current level, if its loader failed. */
  readonly loadError = computed(() => {
    const path = this.drillPath();
    return path.length ? (this.errorKeys().get(this.pathKey(path)) ?? null) : null;
  });

  /** Placeholder of the current depth ("Select Division", "Select District", …). */
  readonly currentLevelPlaceholder = computed(() => {
    const list = this.levelPlaceholders();
    if (!list.length) return '';
    const depth = this.drillPath().length;
    return list[depth] ?? list[list.length - 1] ?? '';
  });

  /** Placeholder shown by the closed control when nothing is selected. */
  readonly placeholderText = computed(
    () => this.levelPlaceholders()[0] ?? this.placeholder(),
  );

  /** Full trail of labels for the current value (empty when nothing is selected). */
  readonly selectedPath = computed<CascaderOption[]>(() => {
    const resolved = this.resolvePath(this.value());
    return resolved.length ? resolved : this.hydratedPath();
  });

  readonly hasValue = computed(() => this.selectedPath().length > 0);

  /** Whether the inline clear button is rendered (drives padding + icon layout). */
  readonly showClear = computed(
    () => this.clearable() && this.hasValue() && !this.isDisabled(),
  );

  /** Every label the trigger renders, joined by `pathSeparator`. */
  readonly displayText = computed(() =>
    this.selectedPath()
      .map((node) => this.labelOf(node))
      .join(this.pathSeparator()),
  );

  /** Search hits: from `searchFn` when set, otherwise the loaded tree is walked. */
  readonly searchResults = computed<CascaderSearchResult[]>(() => {
    if (this.searchFn()) return this.remoteResults();

    const term = this.searchTerm().trim().toLowerCase();
    if (!term) return [];

    const results: CascaderSearchResult[] = [];
    const walk = (rows: CascaderOption[], trail: CascaderOption[]): void => {
      for (const row of rows) {
        const path = [...trail, row];
        if (this.labelOf(row).toLowerCase().includes(term)) {
          results.push({ option: row, path });
        }
        // Loaded (API) branches are searchable too, because their children are cached.
        const children = this.childrenFor(row, path);
        if (children.length) walk(children, path);
      }
    };
    walk(this.options(), []);
    return results;
  });

  /** Rows rendered in the panel, each with the trail needed to select it. */
  readonly visibleItems = computed<CascaderSearchResult[]>(() => {
    if (this.isSearching()) return this.searchResults();

    const trail = this.drillPath();
    return this.currentLevel().map((option) => ({ option, path: [...trail, option] }));
  });

  readonly activeOptionId = computed(() =>
    this.activeIndex() >= 0 ? this.optionId(this.activeIndex()) : null,
  );

  readonly hasActiveOption = computed(
    () => this.activeIndex() >= 0 && this.activeIndex() < this.visibleItems().length,
  );

  /* ---------------------------------------------------------------- */
  /* Labels / values                                                  */
  /* ---------------------------------------------------------------- */

  labelOf(option: CascaderOption): string {
    const bind = this.bindLabel();
    if (bind) {
      const label = option[bind];
      return label === null || label === undefined ? '' : String(label);
    }
    if (option.label !== null && option.label !== undefined) return String(option.label);
    if (option['name'] !== null && option['name'] !== undefined) return String(option['name']);
    return option.value === null || option.value === undefined ? '' : String(option.value);
  }

  valueOf(option: CascaderOption): any {
    const bind = this.bindValue();
    if (bind) return option[bind];
    return option.value === undefined ? option : option.value;
  }

  childrenOf(option: CascaderOption | null | undefined): CascaderOption[] {
    if (!option) return [];
    const children = option[this.bindChildren()];
    return Array.isArray(children) ? children : [];
  }

  /** Static children first, then anything fetched through `loadChildren`. */
  childrenFor(option: CascaderOption, path: CascaderOption[]): CascaderOption[] {
    const staticChildren = this.childrenOf(option);
    if (staticChildren.length) return staticChildren;
    return this.childrenCache().get(this.pathKey(path)) ?? [];
  }

  hasChildren(option: CascaderOption): boolean {
    return this.childrenOf(option).length > 0;
  }

  /**
   * Whether clicking this node opens another level. A node is expandable when it has
   * static children, when a loader is configured and the node is not marked `isLeaf`,
   * or when its fetched children are non-empty.
   */
  canExpand(option: CascaderOption, path: CascaderOption[]): boolean {
    if (option.disabled) return false;
    if (this.hasChildren(option)) return true;
    if (option.isLeaf === true) return false;

    const key = this.pathKey(path);
    const cached = this.childrenCache().get(key);
    if (cached) return cached.length > 0;
    return !!this.loadChildren();
  }

  isSelected(option: CascaderOption): boolean {
    return this.hasValue() && this.sameValue(this.valueOf(option), this.value());
  }

  /** Path shown under a node in search results (its ancestors only). */
  pathLabelOf(item: CascaderSearchResult): string {
    return item.path
      .slice(0, -1)
      .map((node) => this.labelOf(node))
      .join(this.pathSeparator());
  }

  optionId(index: number): string {
    return `${this.idBase}-opt-${index}`;
  }

  isActive(index: number): boolean {
    return this.activeIndex() === index;
  }

  /* ---------------------------------------------------------------- */
  /* Open / close                                                     */
  /* ---------------------------------------------------------------- */

  toggle(): void {
    if (this.isDisabled()) return;
    if (this.isOpen()) this.close();
    else this.open();
  }

  open(): void {
    if (this.isDisabled() || this.isOpen()) return;

    // Start at the parent level of the current value, so the user sees its siblings.
    const selected = this.selectedPath();
    this.drillPath.set(selected.length ? selected.slice(0, -1) : []);
    this.searchTerm.set('');
    this.isOpen.set(true);
    this.activeIndex.set(-1);
    this.openChange.emit(true);
    // Re-opening on a deep value must fetch that level if it is not cached yet.
    const parentPath = this.drillPath();
    if (parentPath.length) this.ensureChildren(parentPath);
    this.focusFirstOption();
  }

  close(): void {
    if (!this.isOpen()) return;
    this.isOpen.set(false);
    this.searchTerm.set('');
    this.activeIndex.set(-1);
    this.openChange.emit(false);
    this.focusTrigger();
  }

  /* ---------------------------------------------------------------- */
  /* Navigation                                                       */
  /* ---------------------------------------------------------------- */

  /** Go up one level; clears the search first when searching. */
  goBack(): void {
    if (this.isSearching()) {
      this.searchTerm.set('');
      this.searchChange.emit('');
      this.activeIndex.set(-1);
      this.focusFirstOption();
      return;
    }

    const path = this.drillPath();
    if (!path.length) return;
    const next = path.slice(0, -1);
    this.drillPath.set(next);
    this.activeIndex.set(-1);
    if (next.length) this.ensureChildren(next);
    this.focusFirstOption();
  }

  /** Jump to a breadcrumb level; `depth` is how many levels to keep. */
  goToLevel(depth: number): void {
    const path = this.drillPath();
    if (depth >= path.length) return;
    const next = path.slice(0, Math.max(0, depth));
    this.drillPath.set(next);
    this.activeIndex.set(-1);
    if (next.length) this.ensureChildren(next);
    this.focusFirstOption();
  }

  onSearchInput(term: string): void {
    this.searchTerm.set(term);
    this.activeIndex.set(-1);
    this.searchChange.emit(term);
  }

  /* ---------------------------------------------------------------- */
  /* Selection                                                        */
  /* ---------------------------------------------------------------- */

  onItemClick(item: CascaderSearchResult): void {
    this.select(item);
  }

  select(item: CascaderSearchResult): void {
    if (this.isDisabled() || item.option.disabled) return;

    // Server search hits already carry their full path: choosing one selects it instead
    // of drilling into a branch we would have to load anyway.
    const fromServerSearch = this.isRemoteSearch() && this.isSearching();

    // A node with children (static or API-backed) drills down unless the consumer
    // allows intermediate values through `changeOnSelect`.
    if (!fromServerSearch && this.canExpand(item.option, item.path) && !this.changeOnSelect()) {
      this.drillPath.set(item.path);
      this.searchTerm.set('');
      this.activeIndex.set(-1);
      this.ensureChildren(item.path);
      this.focusFirstOption();
      return;
    }

    const value = this.valueOf(item.option);
    // Keep the known trail (server search hits) so the trigger can render the breadcrumb.
    this.hydratedPath.set(item.path);
    this.value.set(value);
    this.onTouchedFn();
    this.selectionChange.emit({ value, option: item.option, path: item.path });

    if (this.closeOnSelect()) this.close();
  }

  selectActive(): void {
    const index = this.activeIndex();
    const items = this.visibleItems();
    if (index >= 0 && index < items.length) this.select(items[index]);
  }

  clear(event?: Event): void {
    event?.stopPropagation();
    if (this.isDisabled()) return;
    this.value.set(null);
    this.onTouchedFn();
    this.selectionChange.emit({ value: null, option: null, path: [] });
  }

  /* ---------------------------------------------------------------- */
  /* Keyboard                                                         */
  /* ---------------------------------------------------------------- */

  onTriggerKeydown(event: KeyboardEvent): void {
    if (this.isDisabled()) return;
    switch (event.key) {
      case 'ArrowDown':
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.open();
        break;
      case 'Escape':
        this.close();
        break;
    }
  }

  onPanelKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        event.stopPropagation();
        this.close();
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.moveActive('next');
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.moveActive('prev');
        break;
      case 'Home':
        event.preventDefault();
        this.moveActive('first');
        break;
      case 'End':
        event.preventDefault();
        this.moveActive('last');
        break;
      case 'Enter':
        event.preventDefault();
        this.selectActive();
        break;
      case 'ArrowRight':
        if (this.hasActiveOption()) {
          event.preventDefault();
          this.selectActive();
        }
        break;
      case 'ArrowLeft':
      case 'Backspace': {
        const target = event.target as HTMLInputElement | null;
        // Let the search box edit its own text first.
        if (target?.tagName === 'INPUT' && (target.value ?? '') !== '') return;
        if (this.isSearching() || this.drillPath().length) {
          event.preventDefault();
          this.goBack();
        }
        break;
      }
    }
  }

  /** Hover highlight, skipped for disabled rows so they never look actionable. */
  setActiveIndex(index: number, option: CascaderOption): void {
    if (option.disabled) return;
    this.activeIndex.set(index);
  }

  private moveActive(direction: 'next' | 'prev' | 'first' | 'last'): void {
    const items = this.visibleItems();
    if (!items.length) return;

    const enabled = (index: number): boolean => !items[index].option.disabled;
    let index = this.activeIndex();

    if (direction === 'first') {
      index = items.findIndex((_, i) => enabled(i));
    } else if (direction === 'last') {
      for (let i = items.length - 1; i >= 0; i--) {
        if (enabled(i)) {
          index = i;
          break;
        }
      }
    } else {
      const step = direction === 'next' ? 1 : -1;
      for (let next = index + step; next >= 0 && next < items.length; next += step) {
        if (enabled(next)) {
          index = next;
          break;
        }
      }
    }

    if (index >= 0 && index < items.length && enabled(index)) {
      this.activeIndex.set(index);
      this.scrollActiveIntoView();
    }
  }

  /* ---------------------------------------------------------------- */
  /* Async levels                                                     */
  /* ---------------------------------------------------------------- */

  /** Retry the loader for the current level after a failure. */
  retryLoad(): void {
    const path = this.drillPath();
    if (!path.length) return;
    const key = this.pathKey(path);
    this.errorKeys.update((errors) => {
      const next = new Map(errors);
      next.delete(key);
      return next;
    });
    this.ensureChildren(path);
  }

  /** Drop cached children for one node (or the whole tree) and reload if needed. */
  refresh(node?: CascaderOption): void {
    if (!node) {
      this.childrenCache.set(new Map());
      this.errorKeys.set(new Map());
    } else {
      const key = this.pathKey([node]);
      this.childrenCache.update((cache) => {
        const next = new Map(cache);
        next.delete(key);
        return next;
      });
    }
    const path = this.drillPath();
    if (path.length) this.ensureChildren(path);
  }

  private ensureChildren(path: CascaderOption[]): void {
    if (!path.length) return;
    const node = path[path.length - 1];
    if (node.isLeaf === true || this.hasChildren(node)) return;

    const loader = this.loadChildren();
    if (!loader) return;

    const key = this.pathKey(path);
    if (this.childrenCache().has(key) || this.loadingKeys().has(key)) return;

    this.loadingKeys.update((keys) => new Set(keys).add(key));

    const succeed = (children: CascaderOption[]): void => {
      this.childrenCache.update((cache) => new Map(cache).set(key, children ?? []));
      this.loadingKeys.update((keys) => {
        const next = new Set(keys);
        next.delete(key);
        return next;
      });
    };

    const fail = (error: unknown): void => {
      this.loadingKeys.update((keys) => {
        const next = new Set(keys);
        next.delete(key);
        return next;
      });
      const message = error instanceof Error && error.message ? error.message : this.loadErrorText();
      this.errorKeys.update((errors) => new Map(errors).set(key, message));
    };

    try {
      const result: unknown = loader(node, path);

      if (isThenable<CascaderOption[]>(result)) {
        (result as Promise<CascaderOption[]>).then(succeed).catch(fail);
      } else if (isSubscribable<CascaderOption[]>(result)) {
        // RxJS-style (e.g. HttpClient): take the first value, then unsubscribe.
        let subscription: { unsubscribe?: () => void } | undefined;
        subscription = result.subscribe({
          next: (children: CascaderOption[]) => {
            succeed(children ?? []);
            subscription?.unsubscribe?.();
          },
          error: (error: unknown) => fail(error),
        });
      } else if (Array.isArray(result)) {
        succeed(result as CascaderOption[]);
      } else {
        succeed([]);
      }
    } catch (error) {
      fail(error);
    }
  }

  private pathKey(path: CascaderOption[]): string {
    return path.map((node) => String(this.valueOf(node))).join('\u0001');
  }

  /* ---------------------------------------------------------------- */
  /* ControlValueAccessor                                            */
  /* ---------------------------------------------------------------- */

  writeValue(value: any): void {
    this.lastFormValue = value;
    this.value.set(value ?? null);
  }

  registerOnChange(fn: (value: any) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled);
    if (isDisabled) this.close();
  }

  /* ---------------------------------------------------------------- */
  /* Internals                                                        */
  /* ---------------------------------------------------------------- */

  private sameValue(a: any, b: any): boolean {
    if (a === b) return true;
    if (a === null || a === undefined || b === null || b === undefined) return false;
    if (typeof a === 'object' && typeof b === 'object') {
      try {
        return JSON.stringify(a) === JSON.stringify(b);
      } catch {
        return false;
      }
    }
    return false;
  }

  /** Depth-first lookup of the trail that ends in `value`. */
  private resolvePath(value: any): CascaderOption[] {
    if (value === null || value === undefined || value === '') return [];

    const walk = (rows: CascaderOption[], trail: CascaderOption[]): CascaderOption[] | null => {
      for (const row of rows) {
        const path = [...trail, row];
        if (this.sameValue(this.valueOf(row), value)) return path;
        // Use cached (fetched) children too, so values chosen from an API level resolve.
        const children = this.childrenFor(row, path);
        if (children.length) {
          const found = walk(children, path);
          if (found) return found;
        }
      }
      return null;
    };

    return walk(this.options(), []) ?? [];
  }

  private focusFirstOption(): void {
    if (typeof window === 'undefined') return;
    setTimeout(() => {
      const target = this.searchable() ? this.searchInput() : this.listBox();
      target?.nativeElement.focus();
    });
  }

  private focusTrigger(): void {
    if (typeof window === 'undefined') return;
    setTimeout(() => this.trigger()?.nativeElement.focus());
  }

  private scrollActiveIntoView(): void {
    if (typeof document === 'undefined') return;
    const id = this.activeOptionId();
    if (!id) return;
    setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ block: 'nearest' });
    });
  }
}
