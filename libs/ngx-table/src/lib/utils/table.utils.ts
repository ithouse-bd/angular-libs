import { TableSortDirection } from '../models/table.models';

/** Read a dot-path value (`'a.b.c'`) from an object; `undefined` when a link is missing. */
export function getPathValue(source: unknown, path: string | null | undefined): unknown {
  if (!path) return undefined;
  return path.split('.').reduce<unknown>((value, part) => {
    if (value === null || value === undefined) return undefined;
    return (value as Record<string, unknown>)[part];
  }, source);
}

/** Human readable text for a cell value. */
export function toDisplay(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toLocaleDateString();
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

/** Locale-aware, numeric-friendly comparison used by default sorting. */
export function defaultCompare(a: unknown, b: unknown): number {
  if (a === b) return 0;
  if (a === null || a === undefined) return -1;
  if (b === null || b === undefined) return 1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  if (typeof a === 'boolean' && typeof b === 'boolean') return Number(a) - Number(b);
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
}

/** Sort a value ignoring the direction sign. */
export function compareWithDirection(result: number, direction: TableSortDirection): number {
  return direction === 'asc' ? result : -result;
}

/**
 * Page numbers to render, centred on `current`. First/last/prev/next buttons are
 * separate controls, so no ellipsis is needed.
 */
export function buildPageWindow(current: number, pageCount: number, maxButtons = 5): number[] {
  if (pageCount <= 0) return [];
  const size = Math.max(1, Math.floor(maxButtons) || 1);
  if (pageCount <= size) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }
  const half = Math.floor(size / 2);
  const start = Math.max(1, Math.min(current - half, pageCount - size + 1));
  return Array.from({ length: size }, (_, index) => start + index);
}

/** `true` when the event target is a text field, so row-selection should be skipped. */
export function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return !!target.closest(
    'input, textarea, select, button, a, [contenteditable="true"], [role="button"]',
  );
}
