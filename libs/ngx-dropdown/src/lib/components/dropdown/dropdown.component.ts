import {
  Component,
  ElementRef,
  HostListener,
  QueryList,
  ViewChildren,
  computed,
  effect,
  forwardRef,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import { DropdownChangeEvent, DropdownOption } from '../../models/dropdown.models';

let idCounter = 0;

@Component({
  selector: 'ith-dropdown',
  standalone: true,
  templateUrl: './dropdown.component.html',
  styleUrls: ['./dropdown.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DropdownComponent),
      multi: true,
    },
  ],
})
export class DropdownComponent implements ControlValueAccessor {
  // Inputs
  options = input<DropdownOption[]>([]);
  placeholder = input<string>('Select...');
  multiple = input<boolean>(false);
  searchable = input<boolean>(true);
  disabled = input<boolean>(false);
  clearable = input<boolean>(true);
  closeOnSelect = input<boolean>(true);
  showSelectAll = input<boolean>(true);
  maxHeight = input<string>('250px');
  searchPlaceholder = input<string>('Search...');
  noOptionsText = input<string>('No options found');

  // Binding configuration
  bindLabel = input<string | undefined>(undefined);
  bindValue = input<string | undefined>(undefined);
  groupBy = input<string | undefined>(undefined);

  // Pagination (button based)
  pageable = input<boolean>(false);
  pageSize = input<number>(10);

  // Infinite scroll (opt-in; takes precedence over `pageable` when enabled)
  infiniteScroll = input<boolean>(false);
  /** For server-side mode: whether more pages are available to load. */
  hasMore = input<boolean>(true);

  // Server side mode for API calls
  serverSide = input<boolean>(false);
  totalItems = input<number>(0);
  loading = input<boolean>(false);
  loadingText = input<string>('Loading...');

  // Outputs
  selectionChange = output<DropdownChangeEvent>();
  searchChange = output<string>();
  openChange = output<boolean>();
  pageChange = output<number>();
  /** Emitted (server-side infinite scroll) when the user scrolls near the end of the list. */
  loadMore = output<void>();

  // Model for two-way binding
  value = model<any | any[] | null>(null);

  // Internal state
  isOpen = signal(false);
  searchTerm = signal('');
  currentPage = signal(1);
  /** Index into `flatDisplayOptions` of the keyboard-highlighted option (-1 = none). */
  activeIndex = signal(-1);
  /** How many options to reveal for client-side infinite scroll. */
  visibleCount = signal(0);

  // Unique ids for the ARIA combobox pattern
  readonly idBase = `ith-dd-${idCounter++}`;

  // ControlValueAccessor
  private onChangeFn: (value: any) => void = () => {};
  private onTouchedFn: () => void = () => {};
  /** Last value received from the form (writeValue); used to avoid echoing it back. */
  private lastFormValue: any = null;

  @ViewChildren('optionEl', { read: ElementRef })
  private optionEls?: QueryList<ElementRef<any>>;

  constructor(private elementRef: ElementRef) {
    // Update the form control when value changes, but never echo back a value
    // that the form itself just pushed in via writeValue (avoids init/reset loops).
    effect(() => {
      const v = this.value();
      if (v === this.lastFormValue) return;
      this.onChangeFn(v);
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.closeDropdown();
    }
  }

  // Get display label for an option
  getLabel(option: DropdownOption): string {
    if (this.bindLabel()) {
      const label = option[this.bindLabel()!];
      return label !== undefined && label !== null ? String(label) : '';
    }
    if (option['label'] !== undefined) {
      return String(option['label']);
    }
    // If no label, try common fields or stringify
    if (option['name'] !== undefined) return String(option['name']);
    if (option['text'] !== undefined) return String(option['text']);
    if (option['title'] !== undefined) return String(option['title']);
    return JSON.stringify(option);
  }

  // Get value for an option
  getValue(option: DropdownOption): any {
    if (this.bindValue()) {
      return option[this.bindValue()!];
    }
    if (option['value'] !== undefined) {
      return option['value'];
    }
    // If no bindValue specified, return the whole object
    return option;
  }

  // Get option key for comparison
  private getOptionKey(option: DropdownOption): any {
    return this.getValue(option);
  }

  toggleDropdown(): void {
    if (this.disabled()) return;
    if (this.isOpen()) {
      this.closeDropdown();
    } else {
      this.openDropdown();
    }
  }

  openDropdown(preferLast = false): void {
    if (this.disabled() || this.isOpen()) return;
    this.isOpen.set(true);
    this.openChange.emit(true);
    this.activeIndex.set(-1);
    this.moveActive(preferLast ? 'last' : 'first');
  }

  closeDropdown(): void {
    if (this.isOpen()) {
      this.isOpen.set(false);
      this.openChange.emit(false);
      this.searchTerm.set('');
      this.currentPage.set(1);
      this.visibleCount.set(0);
      this.activeIndex.set(-1);
    }
  }

  // Filtered options
  filteredOptions = computed(() => {
    const filtered = [...this.options()];

    // If server side, don't filter locally
    if (this.serverSide()) {
      return filtered;
    }

    // Apply search filter
    if (this.searchable() && this.searchTerm()) {
      const term = this.searchTerm().toLowerCase();
      return filtered.filter((opt) => {
        const label = this.getLabel(opt).toLowerCase();
        return label.includes(term);
      });
    }

    return filtered;
  });

  // Options that should be rendered (already sliced for paging / infinite scroll).
  visibleOptions = computed(() => {
    const list = this.filteredOptions();

    // Server-side: the consumer decides what is loaded; show everything given.
    if (this.serverSide()) {
      return list;
    }

    // Infinite scroll reveals a growing window of options.
    if (this.infiniteScroll()) {
      const limit = Math.max(this.visibleCount(), Math.max(this.pageSize(), 1));
      return list.slice(0, limit);
    }

    // Button pagination.
    if (this.pageable()) {
      const start = (this.currentPage() - 1) * this.pageSize();
      return list.slice(start, start + this.pageSize());
    }

    return list;
  });

  // Grouped options (preserves order; flattening matches DOM order)
  groupedOptions = computed(() => {
    if (!this.groupBy()) {
      return [{ name: '', options: this.visibleOptions() }];
    }

    const groups: { [key: string]: DropdownOption[] } = {};
    this.visibleOptions().forEach((opt) => {
      const groupName = opt[this.groupBy()!] || 'Other';
      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      groups[groupName].push(opt);
    });

    return Object.keys(groups).map((name) => ({ name, options: groups[name] }));
  });

  /**
   * The exact order options appear in the DOM (grouped order when grouping is on).
   * Used as the index space for keyboard navigation and ARIA ids.
   */
  flatDisplayOptions = computed<DropdownOption[]>(() => {
    if (!this.groupBy()) {
      return this.visibleOptions();
    }
    return this.groupedOptions().flatMap((g) => g.options);
  });

  // Pagination totals
  totalPages = computed(() => {
    if (this.serverSide()) {
      if (this.totalItems() <= 0) return 1;
      return Math.ceil(this.totalItems() / this.pageSize());
    }
    if (!this.pageable()) return 1;
    return Math.ceil(this.filteredOptions().length / this.pageSize());
  });

  hasNextPage = computed(() => this.currentPage() < this.totalPages());
  hasPreviousPage = computed(() => this.currentPage() > 1);

  /** Whether more options can be revealed (client) or requested (server). */
  canLoadMore = computed(() => {
    if (!this.infiniteScroll() || this.loading()) return false;
    if (this.serverSide()) return this.hasMore();
    return this.flatDisplayOptions().length < this.filteredOptions().length;
  });

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      if (this.serverSide()) {
        this.pageChange.emit(page);
      }
    }
  }

  nextPage(): void {
    if (this.hasNextPage()) {
      const page = this.currentPage() + 1;
      this.currentPage.set(page);
      if (this.serverSide()) {
        this.pageChange.emit(page);
      }
    }
  }

  previousPage(): void {
    if (this.hasPreviousPage()) {
      const page = this.currentPage() - 1;
      this.currentPage.set(page);
      if (this.serverSide()) {
        this.pageChange.emit(page);
      }
    }
  }

  onSearchChange(term: string): void {
    this.searchTerm.set(term);
    this.currentPage.set(1);
    this.visibleCount.set(0);
    this.activeIndex.set(-1);
    this.searchChange.emit(term);
    if (this.serverSide()) {
      this.pageChange.emit(1);
    }
  }

  // ---- Infinite scroll ----

  onOptionsScroll(event: Event): void {
    if (!this.infiniteScroll() || this.loading()) return;
    const el = event.target as HTMLElement;
    const threshold = 40;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - threshold) {
      this.loadMoreNow();
    }
  }

  /** Public so the template's "Load more" button can trigger it directly. */
  loadMoreNow(): void {
    if (!this.canLoadMore()) return;
    if (this.serverSide()) {
      this.loadMore.emit();
    } else {
      const step = Math.max(this.pageSize(), 1);
      // `visibleCount` starts at 0 (nothing revealed yet), so grow from the
      // current window rather than from 0 — otherwise the first click is a no-op.
      this.visibleCount.update((v) => Math.max(v, step) + step);
    }
  }

  // ---- Keyboard navigation ----

  onTriggerKeydown(event: KeyboardEvent): void {
    this.handleNavKey(event, false);
  }

  onSearchKeydown(event: KeyboardEvent): void {
    this.handleNavKey(event, true);
  }

  private handleNavKey(event: KeyboardEvent, fromSearch: boolean): void {
    if (this.disabled()) return;

    switch (event.key) {
      case 'Escape':
        if (this.isOpen()) {
          event.preventDefault();
          this.closeDropdown();
        }
        break;

      case 'ArrowDown':
        event.preventDefault();
        if (!this.isOpen()) {
          this.openDropdown(false);
        } else {
          this.moveActive('next');
        }
        break;

      case 'ArrowUp':
        event.preventDefault();
        if (!this.isOpen()) {
          this.openDropdown(true);
        } else {
          this.moveActive('prev');
        }
        break;

      case 'Home':
        if (this.isOpen()) {
          event.preventDefault();
          this.moveActive('first');
        }
        break;

      case 'End':
        if (this.isOpen()) {
          event.preventDefault();
          this.moveActive('last');
        }
        break;

      case 'Enter':
        if (!this.isOpen()) {
          event.preventDefault();
          this.openDropdown(false);
        } else {
          event.preventDefault();
          this.selectActive();
        }
        break;

      case ' ':
      case 'Spacebar':
        // Let the space character type into the search box.
        if (fromSearch) return;
        event.preventDefault();
        if (!this.isOpen()) {
          this.openDropdown(false);
        } else {
          this.selectActive();
        }
        break;
    }
  }

  private moveActive(direction: 'next' | 'prev' | 'first' | 'last'): void {
    const list = this.flatDisplayOptions();
    if (list.length === 0) return;

    const selectable = (o: DropdownOption) => !o['disabled'];
    let idx = this.activeIndex();

    if (direction === 'first') {
      idx = list.findIndex(selectable);
    } else if (direction === 'last') {
      for (let i = list.length - 1; i >= 0; i--) {
        if (selectable(list[i])) {
          idx = i;
          break;
        }
      }
    } else {
      const step = direction === 'next' ? 1 : -1;
      let next = idx;
      for (let i = 0; i < list.length; i++) {
        next += step;
        if (next < 0 || next >= list.length) break;
        if (selectable(list[next])) {
          idx = next;
          break;
        }
      }
    }

    if (idx >= 0 && idx < list.length && selectable(list[idx])) {
      this.activeIndex.set(idx);
      this.scrollActiveIntoView();
    }
  }

  private selectActive(): void {
    const list = this.flatDisplayOptions();
    const idx = this.activeIndex();
    if (idx >= 0 && idx < list.length) {
      this.selectOption(list[idx]);
    }
  }

  private scrollActiveIntoView(): void {
    // Defer to let change detection render the new active element first.
    setTimeout(() => {
      const el = this.optionEls?.toArray()[this.activeIndex()];
      el?.nativeElement.scrollIntoView({ block: 'nearest' });
    });
  }

  // ---- ARIA helpers ----

  optionId(index: number): string {
    return `${this.idBase}-opt-${index}`;
  }

  idOf(option: DropdownOption): string {
    return this.optionId(this.flatDisplayOptions().indexOf(option));
  }

  isActive(option: DropdownOption): boolean {
    return this.flatDisplayOptions()[this.activeIndex()] === option;
  }

  activeOptionId = computed<string | null>(() => {
    const i = this.activeIndex();
    return i >= 0 ? this.optionId(i) : null;
  });

  /**
   * Whether the current value counts as "selected".
   * Replaces the old `| json`-based empty checks (which needed CommonModule).
   */
  hasSelection = computed(() => {
    const v = this.value();
    if (this.multiple()) {
      if (!v) return false; // null / undefined / '' / 0
      if (Array.isArray(v)) return v.length > 0;
      return true; // non-array truthy value (never an "[]")
    }
    return v != null;
  });

  // ---- Selection ----

  isSelected(option: DropdownOption): boolean {
    const currentVal = this.value();
    const optValue = this.getOptionKey(option);

    if (this.multiple() && Array.isArray(currentVal)) {
      return currentVal.some((v) => this.compareValues(v, optValue));
    }
    return this.compareValues(currentVal, optValue);
  }

  private compareValues(a: any, b: any): boolean {
    if (a === b) return true;
    // Deep comparison for objects if needed
    if (typeof a === 'object' && typeof b === 'object' && a !== null && b !== null) {
      return JSON.stringify(a) === JSON.stringify(b);
    }
    return false;
  }

  selectOption(option: DropdownOption): void {
    if (option['disabled'] || this.disabled()) return;

    const optValue = this.getOptionKey(option);

    if (this.multiple()) {
      let currentVal = this.value() as any[];
      if (!Array.isArray(currentVal)) {
        currentVal = [];
      }

      const index = currentVal.findIndex((v) => this.compareValues(v, optValue));
      if (index > -1) {
        currentVal = currentVal.filter((_, i) => i !== index);
      } else {
        currentVal = [...currentVal, optValue];
      }

      this.value.set(currentVal);
      this.onTouchedFn();

      const selectedItems = this.options().filter((o) => {
        const v = this.getOptionKey(o);
        return currentVal.some((cv) => this.compareValues(cv, v));
      });

      this.selectionChange.emit({
        value: currentVal,
        selectedItems: selectedItems,
      });
    } else {
      this.value.set(optValue);
      this.onTouchedFn();

      this.selectionChange.emit({
        value: optValue,
        selectedItems: option,
      });

      if (this.closeOnSelect()) {
        this.closeDropdown();
      }
    }
  }

  selectAll(): void {
    if (!this.multiple()) return;
    const allValues = this.filteredOptions()
      .filter((o) => !o['disabled'])
      .map((o) => this.getOptionKey(o));

    this.value.set(allValues);
    this.onTouchedFn();

    const selectedItems = this.options().filter((o) => {
      const v = this.getOptionKey(o);
      return allValues.some((av) => this.compareValues(av, v));
    });

    this.selectionChange.emit({
      value: allValues,
      selectedItems: selectedItems,
    });
  }

  clearAll(event?: Event): void {
    if (event) event.stopPropagation();
    this.value.set(this.multiple() ? [] : null);
    this.onTouchedFn();

    this.selectionChange.emit({
      value: this.multiple() ? [] : null,
      selectedItems: this.multiple() ? [] : null,
    });
  }

  get displayValue(): string {
    const currentVal = this.value();

    if (this.multiple() && Array.isArray(currentVal)) {
      if (currentVal.length === 0) return this.placeholder();
      if (currentVal.length === 1) {
        const opt = this.options().find((o) =>
          this.compareValues(this.getOptionKey(o), currentVal[0])
        );
        return opt ? this.getLabel(opt) : this.placeholder();
      }
      return `${currentVal.length} items selected`;
    }

    if (currentVal == null) return this.placeholder();

    const opt = this.options().find((o) =>
      this.compareValues(this.getOptionKey(o), currentVal)
    );
    if (opt) {
      return this.getLabel(opt);
    }

    // If value not found in options, try to display it
    if (typeof currentVal === 'object') {
      return this.getLabel(currentVal);
    }

    return String(currentVal);
  }

  // ControlValueAccessor
  writeValue(value: any): void {
    this.lastFormValue = value;
    this.value.set(value);
  }

  registerOnChange(fn: any): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouchedFn = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    // Can be handled via input if needed
  }
}
