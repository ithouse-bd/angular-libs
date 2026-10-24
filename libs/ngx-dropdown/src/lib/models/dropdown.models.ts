export interface DropdownOption {
  value: any;
  label: string;
  disabled?: boolean;
  group?: string;
  [key: string]: any;
}

export interface DropdownGroup {
  name: string;
  options: DropdownOption[];
}

export interface DropdownConfig {
  placeholder?: string;
  searchable?: boolean;
  multiple?: boolean;
  disabled?: boolean;
  closeOnSelect?: boolean;
  maxHeight?: string;
  showSelectAll?: boolean;
  clearable?: boolean;
  searchPlaceholder?: string;
  noOptionsText?: string;
  loadingText?: string;
  // Pagination
  pageable?: boolean;
  pageSize?: number;
  // Grouping
  groupBy?: string;
  // Server-side mode
  serverSide?: boolean;
  totalItems?: number;
  loading?: boolean;
  // Infinite scroll
  infiniteScroll?: boolean;
  hasMore?: boolean;
}

export interface DropdownChangeEvent {
  value: any | any[];
  selectedItems: DropdownOption | DropdownOption[] | null;
}
