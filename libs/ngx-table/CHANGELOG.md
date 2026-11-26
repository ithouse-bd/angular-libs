# Changelog

All notable changes to `@ithouse-bd/ngx-table` are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and
[Semantic Versioning](https://semver.org/).

## [1.1.0] — 2026-11-26

### Added

- **Column header menu** (`showColumnMenu`, default on): sort ascending/descending, clear
  sort, pin to left/right, unpin, fit to content and hide column, per column.
- **`resizable`** — drag a header edge to resize (minimum 56 px); `autosizeColumn(key)` fits a
  column to its content.
- **`reorderable`** — drag headers to reorder columns; hidden columns keep their slot.
- **Named views** (`showViews`) — save, apply and delete named layouts next to the automatic
  preset.
- **`columnStateChange`** — emits `TablePresetState` (`{ hidden, density, order, widths,
  pinned }`) whenever the layout changes.
- **Filter chips** (`showFilterChips`) — removable chips for the search term and every column
  filter, plus "Clear all".
- **Selection bar** (`selectionActions`, `selectionAction`) — bulk actions once rows are
  selected.
- **Row detail** (`#ithTableRowDetail`, `rowDetailTrigger: 'button' | 'row' | 'none'`) —
  full-width expandable panel under a row.
- **CSV and Excel export** — the Export button opens a two-item menu. `.xlsx` is a real
  workbook (bold frozen header row, autofilter, sized columns) produced by a new dependency-free
  ZIP + OOXML writer (`buildXlsxBlob()`, exported publicly); `.csv` keeps the UTF-8 BOM. API:
  `toCsv()`, `toExcel()`, `downloadCsv()`, `downloadExcel()`, `exportAs(format)`, outputs
  `csvExport` and the new `exportFile` (`{ format, fileName, blob, rows }`).
- **Footer totals** — `TableColumn.aggregate` with `sum`, `avg`, `min`, `max`, `count`, plus
  `label` and `format` overrides, rendered in a `<tfoot>` row.
- **Keyboard grid** (`keyboardNavigation`, default on) — single tab stop, arrow/Home/End/
  PageUp/PageDown movement, `Space` selection, `Ctrl/Cmd+C` copy.
- **Sticky header depth** — the header casts a shadow once the body is scrolled.
- **Dark mode polish** — new semantic tokens (`--_on-accent`, `--_toolbar-tint`,
  `--_popover-bg`, `--_elevation`, `--_scroll-thumb`, `--_danger`): readable text on accent
  fills, calmer brand-tinted header, raised popovers/menus with a hairline ring, lighter row
  separators, visible soft scrollbars and a lighter danger red. Light mode is unchanged apart
  from the shared tokens.
- New models: `TablePresetState`, `TableSelectionAction`, `TableSelectionActionEvent`,
  `TableAggregate`, `TableAggregateType`, `TablePin`, `TableRowDetailContext` and the
  `TableRowDetailDirective`.

### Fixed

- **Column preset did not restore.** The preset (and its toolbar popover) was read in the
  constructor, before `storageKey` was bound, and the empty state then overwrote the stored
  value. The preset is now restored once, after inputs are bound, and only persisted
  afterwards. Stored layouts are versioned (`v: 2`) and old 1.0.0 values are still read.
- **The Columns popover was unusable.** It was clipped by the toolbar's `overflow: auto`
  scroll box, so it could be opened but not seen or clicked. Popovers (columns, views, header
  menu) are now `position: fixed` and anchored to their trigger inside the viewport.
- **A single row collapsed the table.** New `minRows` input (default `4`) keeps the body at a
  stable height with empty space below the last row; rows never stretch.
- **Pinned columns only pinned the header.** A later `.ith-table-td { position: relative }`
  rule (used by the copy button) overrode `position: sticky` on body cells, so the header
  stuck while the cells scrolled away. Body, filter and totals cells now stay pinned with the
  header (verified at full horizontal scroll).
- **Compact density did nothing visible.** The `dense`/`compact` modifiers set the public
  `--ith-table-cell-padding` on `.ith-table`, but `--_cell-padding` had already been resolved
  on `:host`, so rows never changed. The modifiers now re-declare the private tokens:
  comfortable rows are 51 px, compact 41 px (header 46 → 40 px).
- The density control is a two-state segmented switch (Comfortable / Compact) instead of a
  single toggle, and `setDensity(density)` sets it explicitly.
- Compact density now tokenises row/header heights (`--ith-table-row-height`,
  `--ith-table-head-height`) so sticky offsets and the minimum height stay correct.

## [1.0.0] — 2026-11-24

### Added

- `<ith-table>` standalone component with signal inputs, `model()` inputs and outputs.
- `TableColumn<T>` configuration: dot-path fields, alignment, widths, formatters, custom
  comparators, custom search/filter values, hidden columns, header/cell classes.
- Client-side mode with global search, per-column filters, sorting and pagination.
- Customizable filters on every column: `filterType` (`text`, `number`, `date`, `select`),
  `filterOptions`, `filterPlaceholder`, `filterPredicate`, `filterAllLabel` and a custom
  control template (`ithTableFilter="key"`).
- Server-side mode (`mode="server"`) with `total`, `loading`, `sortChange`, `searchChange`,
  `filterChange`, `pageChange` and `pageSizeChange` outputs.
- Sorting: `asc → desc → unsorted` cycling, `aria-sort`, custom `sortFn`, table-wide and
  per-column opt-out.
- Selection: `none` / `single` / `multi`, page or all-filtered select-all, indeterminate
  header checkbox, selection preserved across pages by `keyField`.
- Row actions: declarative buttons (icon, class, disabled/hidden rules) and the
  `ithTableRowActions` template.
- Custom templates: `ithTableCell`, `ithTableHeader`, `ithTableFilter`,
  `ithTableRowActions`, `ithTableToolbar`, `ithTableFooter`, `ithTableEmpty`,
  `ithTableRowMenu`.
- Copy to clipboard: `copyable`, a per-cell hover button, Ctrl/Cmd+C on a focused cell and
  the `cellCopy` output.
- Right-click context menu: `rowContextMenu` output plus the projected `ithTableRowMenu`
  template, rendered in a floating panel at the pointer (closes on outside click/Escape).
- Column visibility picker (`showColumnPicker`) with `columnsChange`, persisted together with
  the comfortable/compact density (`showDensityToggle`) through `storageKey`.
- Sticky columns: `sticky: 'start' | 'end'` per column, plus `stickySelection` and
  `stickyActions` for the checkbox/actions columns.
- Native cell tooltips (`TableColumn.tooltip`, default on) and skeleton rows while loading.
- Standalone-only: the `NgxTableModule` wrapper was removed; import the component and the
  template directives directly.
- Brand theming: a single `--ith-table-brand` token now drives the header, hover, selected
  rows, filters, footer, focus ring and toolbar accents via `color-mix()`, in light and dark
  mode.
- Pagination footer: range summary, total label, centred page window, first/previous/next/last
  buttons, rows-per-page selector.
- Presentation: `striped`, `bordered`, `dense`, `hoverable`, `stickyHeader`, `maxHeight`,
  loading overlay and empty state.
- Theming with CSS variables for light, dark (`[data-theme="dark"]` / `.dark`) and system
  (`[data-theme="auto"]`) modes.
- Accessibility: `aria-sort`, `aria-current`, labelled checkboxes and pagination, `aria-busy`,
  `aria-selected` rows, and `Enter`/`Space` activation for clickable rows.
- Published package now ships `DOCUMENTATION.md`, `THEMING.md`, `CHANGELOG.md` and the SVG
  previews next to the README.
- `NgxTableModule` wrapper for NgModule-based applications.
- Documentation (README, DOCUMENTATION, THEMING), SVG previews, MIT license.

### Fixed

- Server mode no longer resets `page` when `search`, `filters`, `sort` or `pageSize` change,
  so one query change produces one request instead of two.
- `filterType: 'date'` compares the calendar date, so ISO strings are not shifted by the
  browser time zone.
- `filterType: 'number'` compares numerically, so `12`, `12.0` and `012` all match `12`.
- Empty-state `colspan` falls back to `1` when the table has no visible columns.
- The host element is `display: block` by default, so the table no longer depends on the
  page's CSS to lay out correctly.

### Requirements

- Angular **20 or newer** (`@angular/common`, `@angular/core` peer dependencies).
- No runtime dependencies except `tslib`.
