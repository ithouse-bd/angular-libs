/** Public models for `<ith-cascader>`: hierarchical (dependent) selects. */

/**
 * One node of a cascading option tree.
 *
 * ```ts
 * const areas: CascaderOption[] = [
 *   {
 *     value: 'barishal',
 *     label: 'Barishal',
 *     children: [{ value: 'barguna', label: 'Barguna', children: [...] }],
 *   },
 * ];
 * ```
 */
export interface CascaderOption<T = any> {
  value: any;
  label: string;
  disabled?: boolean;
  /** Set to `true` for an API-backed node that has no children (renders no chevron). */
  isLeaf?: boolean;
  children?: CascaderOption<T>[];
  [key: string]: any;
}

/**
 * Minimal structural type for an RxJS-style observable. Declaring it here keeps `rxjs`
 * out of this package's dependencies while still accepting `HttpClient` requests.
 */
export interface CascaderObservable<T> {
  subscribe(observer: {
    next: (value: T) => void;
    error?: (error: unknown) => void;
    complete?: () => void;
  }): { unsubscribe?: () => void };
}

/**
 * Loads the children of one node on demand (API call). Return a `Promise` or any
 * RxJS-style observable; the first emitted value is used and the subscription closed.
 *
 * ```ts
 * loadDistricts = (node: CascaderOption) =>
 *   this.http.get<CascaderOption[]>(`/api/districts?division=${node.value}`);
 * ```
 */
export type CascaderChildrenLoader = (
  node: CascaderOption,
  path: CascaderOption[],
) => Promise<CascaderOption[]> | CascaderObservable<CascaderOption[]>;

/**
 * Resolves the root→leaf path of an existing value (edit forms), so the control can show
 * its breadcrumb even when that branch has not been loaded yet.
 */
export type CascaderValueResolver = (
  value: any,
) => Promise<CascaderOption[]> | CascaderObservable<CascaderOption[]>;


/** A node together with the trail of ancestors that leads to it. */
export interface CascaderSearchResult<T = any> {
  option: CascaderOption<T>;
  path: CascaderOption<T>[];
}

/**
 * Server-side search: called with the debounced term, resolves every hit with its
 * root→leaf path so the whole tree is searchable without loading it.
 *
 * ```ts
 * searchAreas = (term: string) =>
 *   this.http.get<CascaderSearchResult[]>(`/api/areas/search?q=${term}`);
 * ```
 */
export type CascaderSearchFn = (
  term: string,
) => Promise<CascaderSearchResult[]> | CascaderObservable<CascaderSearchResult[]>;

/** Emitted whenever the selection changes (including clearing). */
export interface CascaderChangeEvent<T = any> {
  value: any;
  /** The selected node, or `null` when the value was cleared. */
  option: CascaderOption<T> | null;
  /** Every level from the root to the selected node. */
  path: CascaderOption<T>[];
}
